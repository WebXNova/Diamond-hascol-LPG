const Product = require("../../models/product.model");
const { v2: cloudinary } = require("cloudinary");
const multer = require("multer");
const { Readable } = require("stream");

// Configure Cloudinary - require environment variables for production
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

// Only configure if all credentials are provided
if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName.trim(),
    api_key: apiKey.trim(),
    api_secret: apiSecret.trim(),
  });
  console.log("✅ Cloudinary configured successfully");
  console.log(`   Cloud Name: ${cloudName.trim()}`);
  console.log(`   API Key: ${apiKey.trim().substring(0, 5)}...`);
} else {
  console.error("❌ Cloudinary credentials not configured. Image uploads will fail.");
  console.error("💡 Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env");
  console.error(`   Current values: cloudName=${cloudName ? 'SET' : 'MISSING'}, apiKey=${apiKey ? 'SET' : 'MISSING'}, apiSecret=${apiSecret ? 'SET' : 'MISSING'}`);
}

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
    // Check if Cloudinary is configured (trim to handle whitespace from .env)
    const trimmedCloudName = cloudName ? cloudName.trim() : null;
    const trimmedApiKey = apiKey ? apiKey.trim() : null;
    const trimmedApiSecret = apiSecret ? apiSecret.trim() : null;
    
    if (!trimmedCloudName || !trimmedApiKey || !trimmedApiSecret) {
      reject(new Error("Cloudinary is not configured. Please set environment variables."));
      return;
    }

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

  // Only attempt deletion if Cloudinary is configured
  if (!cloudName || !apiKey || !apiSecret) {
    console.warn("⚠️  Cloudinary not configured, skipping image deletion");
    return Promise.resolve();
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

    // Return products with exact same structure as user API for consistency
    const formattedProducts = products.map((product) => ({
      id: product.id,
      name: product.name,
      category: product.category,
      description: product.description || null,
      price: parseFloat(product.price),
      imageUrl: product.imageUrl || null,
      inStock: product.inStock !== false, // Explicit boolean check
      createdAt: product.createdAt ? product.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: product.updatedAt ? product.updatedAt.toISOString() : new Date().toISOString(),
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

    // Return product with exact same structure as user API for consistency
    const formattedProduct = {
      id: product.id,
      name: product.name,
      category: product.category,
      description: product.description || null,
      price: parseFloat(product.price),
      imageUrl: product.imageUrl || null,
      inStock: product.inStock !== false, // Explicit boolean check
      createdAt: product.createdAt ? product.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: product.updatedAt ? product.updatedAt.toISOString() : new Date().toISOString(),
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
    let imageUrl = product.imageUrl; // Keep existing image if no new upload
    if (req.file) {
      // Validate Cloudinary is configured before attempting upload (trim to handle whitespace)
      const trimmedCloudName = cloudName ? cloudName.trim() : null;
      const trimmedApiKey = apiKey ? apiKey.trim() : null;
      const trimmedApiSecret = apiSecret ? apiSecret.trim() : null;
      
      if (!trimmedCloudName || !trimmedApiKey || !trimmedApiSecret) {
        console.error("❌ Cloudinary config check failed:", {
          cloudName: trimmedCloudName ? 'SET' : 'MISSING',
          apiKey: trimmedApiKey ? 'SET' : 'MISSING',
          apiSecret: trimmedApiSecret ? 'SET' : 'MISSING'
        });
        return res.status(500).json({
          success: false,
          error: "Image upload is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.",
        });
      }

      try {
        // Upload new image to Cloudinary
        console.log('📤 Attempting Cloudinary upload...');
        const uploadedUrl = await uploadToCloudinary(req.file.buffer);
        
        if (!uploadedUrl || typeof uploadedUrl !== 'string') {
          throw new Error('Cloudinary upload returned invalid URL');
        }
        
        imageUrl = uploadedUrl; // Store the secure URL from Cloudinary
        
        // Delete old image if exists (after successful upload)
        if (product.imageUrl && product.imageUrl !== uploadedUrl) {
          await deleteFromCloudinary(product.imageUrl).catch((err) => {
            // Log but don't fail - old image deletion is not critical
            console.warn("⚠️  Failed to delete old image (non-critical):", err.message);
          });
        }
        
        console.log(`✅ Image uploaded successfully: ${uploadedUrl}`);
      } catch (uploadError) {
        console.error("❌ Image upload error:", uploadError);
        console.error("   Error details:", {
          message: uploadError.message,
          name: uploadError.name,
          http_code: uploadError.http_code
        });
        
        // Provide specific error message for signature errors
        let errorMessage = uploadError.message || "Failed to upload image. Please check Cloudinary configuration and try again.";
        if (uploadError.message && uploadError.message.includes('Invalid Signature')) {
          errorMessage = "Cloudinary API secret is incorrect. Please check CLOUDINARY_API_SECRET in .env file. The secret should ONLY contain the secret value (not CLOUDINARY_URL=...).";
        }
        
        return res.status(500).json({
          success: false,
          error: errorMessage,
        });
      }
    }

    // Validate and prepare update data
    const updateData = {};
    
    // Validate name (required, non-empty string)
    if (name !== undefined) {
      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Product name is required and must be a non-empty string'
        });
      }
      updateData.name = name.trim();
    }
    
    // Validate category (must be 'Domestic' or 'Commercial')
    if (category !== undefined) {
      if (!category || typeof category !== 'string' || !['Domestic', 'Commercial'].includes(category.trim())) {
        return res.status(400).json({
          success: false,
          error: "Category must be 'Domestic' or 'Commercial'"
        });
      }
      updateData.category = category.trim();
    }
    
    // Validate description (optional, but if provided must be string)
    if (description !== undefined) {
      if (description !== null && description !== '' && typeof description !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Description must be a string or null'
        });
      }
      updateData.description = description ? description.trim() : null;
    }
    
    // Validate price (required, positive number)
    if (price !== undefined) {
      if (price === null || price === '') {
        return res.status(400).json({
          success: false,
          error: 'Price is required'
        });
      }
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Price must be a positive number greater than 0'
        });
      }
      updateData.price = priceNum;
    }
    
    // Validate inStock (boolean)
    if (inStock !== undefined) {
      updateData.inStock = Boolean(inStock);
    }
    
    // Update imageUrl if new image was uploaded successfully
    if (req.file && imageUrl) {
      updateData.imageUrl = imageUrl;
    }

    // Update product in database
    // Sequelize automatically maps imageUrl (camelCase) to image_url (snake_case) in DB
    await product.update(updateData);
    
    // Reload product from database to get fresh data (ensures we return what's actually in DB)
    await product.reload();
    
    // Verify image_url was saved correctly (double-check for production safety)
    if (updateData.imageUrl) {
      const reloadedProduct = await Product.findByPk(product.id);
      if (reloadedProduct && reloadedProduct.imageUrl !== updateData.imageUrl) {
        console.warn('⚠️  Warning: image_url may not have been saved correctly, retrying...');
        // Try to update again explicitly
        await product.update({ imageUrl: updateData.imageUrl });
        await product.reload();
      }
    }

    // Return product with exact same structure as user API for consistency
    const formattedProduct = {
      id: product.id,
      name: product.name,
      category: product.category,
      description: product.description || null,
      price: parseFloat(product.price),
      imageUrl: product.imageUrl || null,
      inStock: product.inStock !== false, // Explicit boolean check
      createdAt: product.createdAt ? product.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: product.updatedAt ? product.updatedAt.toISOString() : new Date().toISOString(),
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
