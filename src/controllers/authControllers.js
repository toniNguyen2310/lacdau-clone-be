const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const keyAccessToken = process.env.JWT_ACCESS_KEY;
const keyRefreshToken = process.env.JWT_REFRESH_KEY;
require("dotenv").config();

let refreshTokens = [];
const authController = {
  //REGISTER
  registerUser: async (req, res) => {
    try {
      //bcrypt
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(req.body.password, salt);

      //Create new user
      const newUser = await new User({
        email: req.body.email,
        username: req.body.username,
        password: hashed,
        phone: req.body.phone,
      });

      //Save to DB
      const user = await newUser.save();
      res.status(200).json({
        EC: 0,
        data: user,
      });
    } catch (error) {
      res.status(500).json({
        EC: -2,
        data: error,
      });
    }
  },

  //GENERATE ACCESS TOKEN
  generateAccessToken: (user) => {
    return jwt.sign({ id: user.id, admin: user.admin }, keyAccessToken, {
      expiresIn: "20s",
    });
  },

  //GENERATE REFRESH TOKEN
  generateRefreshToken: (user) => {
    return jwt.sign({ id: user.id, admin: user.admin }, keyRefreshToken, {
      expiresIn: "365d",
    });
  },

  // LOGIN
  loginUser: async (req, res) => {
    try {
      const user = await User.findOne({ email: req.body.email });

      //Kiểm tra xác thực email
      if (!user) {
        return res.status(404).json({
          EC: -1,
          data: "Wrong email",
        });
      }

      //Kiểm tra xác thực pasword
      const validatePassword = await bcrypt.compare(
        req.body.password,
        user.password
      );

      if (!validatePassword) {
        return res.status(404).json({
          EC: -1,
          data: "Wrong password",
        });
      }

      //Trùng email và password
      if (user && validatePassword) {
        const accessToken = authController.generateAccessToken(user);
        const refreshToken = authController.generateRefreshToken(user);
        refreshTokens.push(refreshToken);
        //Lưu Refresh Token vào cookies
        res.cookie("refreshToken", refreshToken, {
          httpOnly: true,
          secure: false,
          path: "/",
          sameSite: "strict",
        });

        //Loaị bỏ password khi login
        const { password, ...others } = user._doc;
        res.status(200).json({
          EC: 0,
          data: { ...others, accessToken },
        });
      }
    } catch (error) {
      res.status(500).json({
        EC: -2,
        data: error,
      });
    }
  },

  //REQUEST REFRESH TOKEN
  requestRefreshToken: async (req, res) => {
    //take refresh token from user
    const refreshToken = req.headers.cookie.split("=")[1];
    if (!refreshToken) {
      return res
        .status(401)
        .json({ EC: -2, data: "You are not authenticated" });
    }

    //Kiểm tra trùng lặp refresh token trong kho
    if (!refreshTokens.includes(refreshToken)) {
      return res
        .status(403)
        .json({ EC: -2, data: "Refresh Token is not valid" });
    }

    jwt.verify(refreshToken, keyRefreshToken, (err, user) => {
      console.log("user refresh token>>> ", user);
      if (err) {
        console.log("error verify refresh token >>>> ", err);
      }

      //Lọc refresh token cũ ra khỏi db
      refreshTokens.filter((token) => token !== refreshToken);

      //Create new access token and refresh token
      const newAccessToken = authController.generateAccessToken(user);
      const newRefreshToken = authController.generateRefreshToken(user);

      //Thêm token mới vào db
      refreshTokens.push(newRefreshToken);

      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: false,
        path: "/",
        sameSite: "strict",
      });

      res.status(200).json({
        EC: 0,
        data: { EC: 0, data: newAccessToken },
      });
    });
  },

  //LOGOUT
  logoutUser: async (req, res) => {
    res.clearCookie("refreshToken");
    refreshTokens = refreshTokens.filter(
      (token) => token !== req.headers.cookie.split("=")[1]
    );
    return res.status(200).json({
      EC: 0,
      data: { EC: 0, data: "Logout successfully" },
    });
  },
};

module.exports = authController;