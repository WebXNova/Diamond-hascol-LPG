const Product = require("../../models/product.model");
const { v2: cloudinary } = require("cloudinary");
const multer = require("multer");
const { Readable } = require("stream");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "demo",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
});

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG, and WebP images are allowed"), false);
    }
  },
});

// Helper function to upload image to Cloudinary
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        folder: "diamond-hascol-products",
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result.secure_url);
        }
      }
    );

    const stream = Readable.from(buffer);
    stream.pipe(uploadStream);
  });
};

// Helper function to delete image from Cloudinary
const deleteFromCloudinary = (imageUrl) => {
  if (!imageUrl || !imageUrl.includes("cloudinary.com")) {
    return Promise.resolve(); // Not a Cloudinary URL, skip deletion
  }

  // Extract public_id from URL
  const urlParts = imageUrl.split("/");
  const filename = urlParts[urlParts.length - 1];
  const publicId = `diamond-hascol-products/${filename.split(".")[0]}`;

  return cloudinary.uploader.destroy(publicId);
};

/**
 * Get all products (admin) - Only returns the two fixed products
 * GET /api/admin/products
 */
const getAllProducts = async (req, res, next) => {
  try {
    // Only fetch products with category Domestic or Commercial
    const products = await Product.findAll({
      where: {
        category: ['Domestic', 'Commercial']
      },
      order: [["category", "ASC"]],
    });

    const formattedProducts = products.map((product) => ({
      id: product.id,
      name: product.name || "",
      category: product.category || null,
      description: product.description || null,
      price: parseFloat(product.price) || 0,
      imageUrl: product.imageUrl || null,
      inStock: product.inStock !== false,
      createdAt: product.createdAt
        ? product.createdAt.toISOString()
        : new Date().toISOString(),
      updatedAt: product.updatedAt
        ? product.updatedAt.toISOString()
        : new Date().toISOString(),
    }));

    return res.status(200).json({
      success: true,
      data: formattedProducts,
    });
  } catch (error) {
    console.error("❌ Error fetching products:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch products. Please try again.",
    });
  }
};

/**
 * Get product by ID (admin)
 * GET /api/admin/products/:id
 */
const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Product ID is required",
      });
    }

    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    // Only allow access to Domestic or Commercial products
    if (product.category !== 'Domestic' && product.category !== 'Commercial') {
      return res.status(403).json({
        success: false,
        error: "Access denied",
      });
    }

    const formattedProduct = {
      id: product.id,
      name: product.name || "",
      category: product.category || null,
      description: product.description || null,
      price: parseFloat(product.price) || 0,
      imageUrl: product.imageUrl || null,
      inStock: product.inStock !== false,
      createdAt: product.createdAt
        ? product.createdAt.toISOString()
        : new Date().toISOString(),
      updatedAt: product.updatedAt
        ? product.updatedAt.toISOString()
        : new Date().toISOString(),
    };

    return res.status(200).json({
      success: true,
      data: formattedProduct,
    });
  } catch (error) {
    console.error("❌ Error fetching product:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch product. Please try again.",
    });
  }
};

/**
 * Update product (admin) - Only allows editing the two fixed products
 * PATCH /api/admin/products/:id
 */
const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Extract form fields (multer puts text fields in req.body)
    const name = req.body.name;
    const category = req.body.category;
    const description = req.body.description;
    const price = req.body.price;
    // inStock comes as string from FormData ('true' or 'false'), convert to boolean
    let inStock = undefined;
    if (req.body.inStock !== undefined) {
      inStock = req.body.inStock === 'true' || req.body.inStock === true || req.body.inStock === '1';
    }

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Product ID is required",
      });
    }

    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    // Only allow editing Domestic or Commercial products
    if (product.category !== 'Domestic' && product.category !== 'Commercial') {
      return res.status(403).json({
        success: false,
        error: "Only Domestic and Commercial products can be edited",
      });
    }

    // Validate category if provided
    if (category !== undefined) {
      if (category !== 'Domestic' && category !== 'Commercial') {
        return res.status(400).json({
          success: false,
          error: "Category must be 'Domestic' or 'Commercial'",
        });
      }
    }

    // Validate price if provided
    if (price !== undefined) {
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum <= 0) {
        return res.status(400).json({
          success: false,
          error: "Price must be a number greater than 0",
        });
      }
    }

    // inStock is already converted to boolean above

    // Handle image upload if present
    let imageUrl = product.imageUrl;
    if (req.file) {
      try {
        // Delete old image if exists
        if (product.imageUrl) {
          await deleteFromCloudinary(product.imageUrl).catch((err) =>
            console.error("Failed to delete old image:", err)
          );
        }
        imageUrl = await uploadToCloudinary(req.file.buffer);
      } catch (uploadError) {
        console.error("❌ Image upload error:", uploadError);
        return res.status(500).json({
          success: false,
          error: "Failed to upload image. Please try again.",
        });
      }
    }

    // Update product fields
    const updateData = {};
    if (name !== undefined && name !== null && name.trim()) {
      updateData.name = name.trim();
    }
    if (category !== undefined && category !== null && category.trim()) {
      updateData.category = category;
    }
    if (description !== undefined) {
      updateData.description = description ? description.trim() : null;
    }
    if (price !== undefined && price !== null && price !== '') {
      const priceNum = parseFloat(price);
      if (!isNaN(priceNum) && priceNum > 0) {
        updateData.price = priceNum;
      }
    }
    if (inStock !== undefined) {
      updateData.inStock = Boolean(inStock);
    }
    // Only update imageUrl if a new image was uploaded
    if (req.file && imageUrl) {
      updateData.imageUrl = imageUrl;
    }

    await product.update(updateData);
    
    // Reload product from database to get fresh data
    await product.reload();

    const formattedProduct = {
      id: product.id,
      name: product.name,
      category: product.category,
      description: product.description,
      price: parseFloat(product.price),
      imageUrl: product.imageUrl,
      inStock: product.inStock,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };

    return res.status(200).json({
      success: true,
      data: formattedProduct,
    });
  } catch (error) {
    console.error("❌ Error updating product:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to update product. Please try again.",
    });
  }
};

// Export multer middleware for use in routes
const uploadMiddleware = upload.single("image");

module.exports = {
  getAllProducts,
  getProductById,
  updateProduct,
  uploadMiddleware,
};
