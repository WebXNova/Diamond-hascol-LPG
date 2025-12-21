const Product = require("../models/product.model");

/**
 * Get all active products
 * GET /api/products
 * 
 * Response:
 * {
 *   success: true,
 *   data: [products]
 * }
 */
const getAllProducts = async (req, res, next) => {
  try {
    // Only return Domestic and Commercial products
    const products = await Product.findAll({
      where: {
        category: ['Domestic', 'Commercial']
      },
      order: [['category', 'ASC'], ['id', 'ASC']]
    });

    // Transform products to include price as number
    const transformedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      category: product.category,
      description: product.description || null,
      price: parseFloat(product.price),
      imageUrl: product.imageUrl || null,
      inStock: product.inStock !== false, // Default to true if not set
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    }));

    return res.status(200).json({
      success: true,
      data: transformedProducts
    });

  } catch (error) {
    console.error('❌ Error fetching products:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch products. Please try again.'
    });
  }
};

/**
 * Get product by ID
 * GET /api/products/:id
 * 
 * Response:
 * {
 *   success: true,
 *   data: product
 * }
 */
const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Product ID is required'
      });
    }

    // Try to find by ID first (numeric)
    let product = null;
    const numericId = parseInt(id, 10);
    if (!isNaN(numericId)) {
      product = await Product.findOne({
        where: {
          id: numericId
        }
      });
    }

    // If not found by ID, try to find by category (for backward compatibility with 'domestic', 'commercial')
    if (!product) {
      const categoryMap = {
        'domestic': 'Domestic',
        'commercial': 'Commercial'
      };
      const normalizedCategory = categoryMap[id.toLowerCase()] || id;
      
      product = await Product.findOne({
        where: {
          category: normalizedCategory
        }
      });
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Transform product to include price as number
    const transformedProduct = {
      id: product.id,
      name: product.name,
      category: product.category,
      description: product.description || null,
      price: parseFloat(product.price),
      imageUrl: product.imageUrl || null,
      inStock: product.inStock !== false, // Default to true if not set
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    };

    return res.status(200).json({
      success: true,
      data: transformedProduct
    });

  } catch (error) {
    console.error('❌ Error fetching product:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch product. Please try again.'
    });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
};

