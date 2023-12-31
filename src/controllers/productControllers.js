const Product = require("../models/product");
const productService = require("../services/productService");

const productControllers = {
  //CREATE NEW PRODUCT
  createProduct: async (req, res) => {
    try {
      const price = req.body.price;
      const priceAfter = (
        parseInt(req.body.price) *
        ((100 - parseInt(req.body.discount)) / 100)
      ).toFixed(0);
      console.log("price>>> ", price, req.body.discount, priceAfter);

      const newProduct = {
        name: req.body.name,
        description: req.body.description,
        price: price,
        discount: req.body.discount,
        priceAfter: priceAfter,
        images: req.body.images,
        brand: req.body.brand,
        category: req.body.category,
        inventory: req.body.inventory,
      };
      console.log("newProduct>>> ", newProduct);

      const createProduct = await Product.create(newProduct);
      console.log("createProduct>>> ", createProduct);
      return res.status(200).json({
        errCode: 0,
        message: "Tạo sản phẩm thành công!!!",
        data: createProduct,
      });
    } catch (error) {
      res.status(500).json({
        errCode: 1,
        message: "Sản phẩm đã tồn tại",
        error: error,
      });
    }
  },

  //GET PRODUCT CATEGORY SLICE TO DISPLAY HOMEPAGE
  getProductByCateSlice: async (req, res) => {
    try {
      console.log("req.params", req.params);
      const categoryName = req.params.category_name;
      const products = await Product.find({ category: categoryName });
      if (products.length >= 10) {
        const productSlice = products.slice(0, 10);
        console.log("slice");
        return res.status(200).json({
          errCode: 0,
          message: "Đã tìm thấy DS sản phẩm",
          data: productSlice,
        });
      } else {
        const productSlice = products;
        console.log("ko slice");
        return res.status(200).json({
          errCode: 0,
          message: "Đã tìm thấy DS sản phẩm",
          data: productSlice,
        });
      }
    } catch (error) {
      res.status(500).json({
        errCode: 1,
        message: "Không tìm thấy sản phẩm",
        error: error,
      });
    }
  },

  //GET PRODUCT BY ID
  getProductById: async (req, res) => {
    console.log("req.params>>>2", req.params);
    try {
      const product = await Product.findById(req.params.id);
      return res.status(200).json({
        errCode: 0,
        message: "Đã tìm thấy sản phẩm",
        data: product,
      });
    } catch (error) {
      res.status(500).json({
        errCode: 1,
        message: "Không tìm thấy sản phẩm",
        error: error,
      });
    }
  },

  //GET PRODUCT BY CATEGORY
  getProductByCategoryName: async (req, res) => {
    console.log("req.params>>> ", req.params);
    try {
      const categoryName = req.params.category_name;
      const limit = 10;
      const page = req.query.page ? req.query.page : 1;
      const products = await productService.getProductByCategoryService(
        limit,
        page,
        categoryName
      );
      console.log("products>> ", products);
      // const products = await Product.find({ category: categoryName });
      return res.status(200).json({
        errCode: 0,
        message: "Đã tìm thấy danh mục sản phẩm",
        data: products,
      });
    } catch (error) {
      res.status(500).json({
        errCode: 1,
        message: "Không tìm thấy danh mục sản phẩm",
        error: error,
      });
    }
  },

  //GET ALL PRODUCT
  getAllProducts: async (req, res) => {
    try {
      console.log("req>> ", req.query);
      const limit = req.query.pageSize;
      const page = req.query.current ? req.query.current : 1;
      // const name = req.query.name ? { name: req.query.name } : {};
      // const category = req.query.category
      //   ? { category: req.query.category }
      //   : {};
      const name = req.query.name
        ? { name: { $regex: req.query.name, $options: "i" } }
        : {};

      const category = req.query.category
        ? req.query.category === "All"
          ? {}
          : { category: { $regex: req.query.category, $options: "i" } }
        : {};

      const brand = req.query.brand
        ? req.query.brand === "All"
          ? {}
          : { brand: { $regex: req.query.brand, $options: "i" } }
        : {};

      const sort = req.query.priceAfter
        ? { priceAfter: req.query.priceAfter }
        : req.query.updatedAt
        ? { updatedAt: req.query.updatedAt }
        : {};
      console.log("sort>>> ", sort);

      const filterPrice =
        req.query.filterPrice === "op01"
          ? {
              $expr: { $lte: [{ $toDouble: "$priceAfter" }, 100000] },
            }
          : req.query.filterPrice === "op12"
          ? {
              $and: [
                // GT FIRST
                { $expr: { $gte: [{ $toDouble: "$priceAfter" }, 100000] } },
                // LT LAST
                { $expr: { $lte: [{ $toDouble: "$priceAfter" }, 200000] } },
              ],
            }
          : req.query.filterPrice === "op25"
          ? {
              $and: [
                // GT FIRST
                { $expr: { $gte: [{ $toDouble: "$priceAfter" }, 200000] } },
                // LT LAST
                { $expr: { $lte: [{ $toDouble: "$priceAfter" }, 500000] } },
              ],
            }
          : req.query.filterPrice === "op50"
          ? {
              $expr: { $gte: [{ $toDouble: "$priceAfter" }, 500000] },
            }
          : {};
      const { products, count } = await productService.getAllProductsService(
        limit,
        page,
        name,
        category,
        brand,
        sort,
        filterPrice
      );
      return res.status(200).json({
        errCode: 0,
        message: "Đã tìm thấy danh mục sản phẩm",
        data: { products, count },
      });
    } catch (error) {
      res.status(500).json({
        errCode: 1,
        message: "Không tìm thấy danh mục sản phẩm",
        error: error,
      });
    }
  },
  //PUT PRODUCT BY ID
  editProductById: async (req, res) => {
    console.log("req>>>", req.params);
    try {
      console.log("req.body>>> ", req.body);
      const product = await Product.findByIdAndUpdate(
        req.params.id,
        {
          _id: req.params.id,
          name: req.body.name,
          description: req.body.description,
          price: req.body.price,
          discount: req.body.discount,
          priceAfter: (
            parseInt(req.body.price) *
            ((100 - parseInt(req.body.discount)) / 100)
          ).toFixed(0),
          images: req.body.images,
          brand: req.body.brand,
          category: req.body.category,
          inventory: req.body.inventory,
        },
        { new: true }
      );
      console.log("product>> ", product);
      return res.status(200).json({
        errCode: 0,
        message: "Sản phẩm đã được cập nhật",
        data: product,
      });
    } catch (error) {
      res.status(500).json({
        errCode: 1,
        message: "Có lỗi xảy ra, không cập nhật được sản phẩm",
        error: error,
      });
    }
  },

  //DELETE PRODUCT BY ID
  deleteProductById: async (req, res) => {
    console.log("req.params.id>>>", req.params.id);
    try {
      const product = await Product.findByIdAndRemove(req.params.id);
      return res.status(200).json({
        errCode: 0,
        message: "Xóa sản phẩm thành công",
        data: product,
      });
    } catch (error) {
      res.status(500).json({
        errCode: 1,
        message: "Có lỗi xảy ra, không xóa được sản phẩm",
        error: error,
      });
    }
  },

  //SEARCH RPRODUCT NAVBAR
  searchProductNavbar: async (req, res) => {
    function stringToSlug(str) {
      // remove accents
      var from =
          "àáãảạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệđùúủũụưừứửữựòóỏõọôồốổỗộơờớởỡợìíỉĩịäëïîöüûñçýỳỹỵỷ",
        to =
          "aaaaaaaaaaaaaaaaaeeeeeeeeeeeduuuuuuuuuuuoooooooooooooooooiiiiiaeiiouuncyyyyy";
      for (var i = 0, l = from.length; i < l; i++) {
        str = str.replace(RegExp(from[i], "gi"), to[i]);
      }

      str = str
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\-]/g, "-")
        .replace(/-+/g, "-");

      return str;
    }
    const search = req.query.value;
    console.log("search>> ", search);
    try {
      // const products = await Product.find({
      //   name: { $regex: "^" + search, $options: "i" },
      // }).limit(4);

      const products = await Product.find();

      let list = products.filter((e) =>
        stringToSlug(e.name).includes(stringToSlug(search))
      );
      list = list.slice(0, 4);
      console.log("list>> ", list);
      if (list.length === 0) {
        return res.status(200).json({
          errCode: 0,
          message: "KHÔNG CÓ SẢN PHẨM",
        });
      } else {
        return res.status(200).json({
          errCode: 0,
          message: "Đã tìm thấy danh mục sản phẩm",
          data: list,
        });
      }
    } catch (error) {
      res.status(500).json({
        errCode: 1,
        message: "Không tìm thấy danh mục sản phẩm",
        error: error,
      });
    }
  },
};

module.exports = productControllers;
