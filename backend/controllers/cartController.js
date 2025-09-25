const { query, transaction } = require('../config/database');

// Get user's cart with product details
const getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get or create cart for user
    const cartResult = await query(`
      SELECT id FROM cart 
      WHERE user_id = $1
    `, [userId]);

    let cartId;
    if (cartResult.rows.length === 0) {
      const newCart = await query(`
        INSERT INTO cart (user_id) VALUES ($1) RETURNING id
      `, [userId]);
      cartId = newCart.rows[0].id;
    } else {
      cartId = cartResult.rows[0].id;
    }

    // Get cart items with product details
    const cartItemsQuery = `
      SELECT 
        ci.id as cart_item_id,
        ci.quantity,
        ci.created_at as added_at,
        p.id as product_id,
        p.name,
        p.slug,
        p.price,
        p.compare_price,
        p.stock_quantity,
        p.images,
        p.is_active,
        (p.price * ci.quantity) as item_total
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.cart_id = $1 AND p.is_active = TRUE
      ORDER BY ci.created_at DESC
    `;

    const cartItems = await query(cartItemsQuery, [cartId]);

    // Calculate cart totals
    const items = cartItems.rows.map(item => ({
      id: item.cart_item_id,
      productId: item.product_id,
      name: item.name,
      slug: item.slug,
      price: parseFloat(item.price),
      comparePrice: item.compare_price ? parseFloat(item.compare_price) : null,
      quantity: item.quantity,
      stockQuantity: item.stock_quantity,
      image: item.images && item.images[0] ? item.images[0] : null,
      itemTotal: parseFloat(item.item_total),
      addedAt: item.added_at,
      inStock: item.stock_quantity > 0,
      availableQuantity: Math.min(item.quantity, item.stock_quantity)
    }));

    const subtotal = items.reduce((sum, item) => sum + item.itemTotal, 0);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    res.json({
      success: true,
      data: {
        cart: {
          id: cartId,
          items,
          itemCount,
          subtotal: subtotal,
          total: subtotal, // Add tax/shipping calculation later
          updatedAt: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve cart'
    });
  }
};

// Add item to cart
const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity } = req.body;

    // Verify product exists and is active
    const productResult = await query(`
      SELECT id, name, price, stock_quantity, is_active 
      FROM products 
      WHERE id = $1 AND is_active = TRUE
    `, [productId]);

    if (productResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or not available'
      });
    }

    const product = productResult.rows[0];

    // Check stock availability
    if (product.stock_quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock_quantity} items available in stock`
      });
    }

    const result = await transaction(async (client) => {
      // Get or create cart
      let cartResult = await client.query(`
        SELECT id FROM cart WHERE user_id = $1
      `, [userId]);

      let cartId;
      if (cartResult.rows.length === 0) {
        const newCart = await client.query(`
          INSERT INTO cart (user_id) VALUES ($1) RETURNING id
        `, [userId]);
        cartId = newCart.rows[0].id;
      } else {
        cartId = cartResult.rows[0].id;
      }

      // Check if item already exists in cart
      const existingItem = await client.query(`
        SELECT id, quantity FROM cart_items 
        WHERE cart_id = $1 AND product_id = $2
      `, [cartId, productId]);

      if (existingItem.rows.length > 0) {
        // Update existing item
        const newQuantity = existingItem.rows[0].quantity + quantity;
        
        if (newQuantity > product.stock_quantity) {
          throw new Error(`Cannot add ${quantity} more items. Only ${product.stock_quantity - existingItem.rows[0].quantity} additional items available.`);
        }

        const updatedItem = await client.query(`
          UPDATE cart_items 
          SET quantity = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
          RETURNING *
        `, [newQuantity, existingItem.rows[0].id]);

        return updatedItem.rows[0];
      } else {
        // Add new item
        const newItem = await client.query(`
          INSERT INTO cart_items (cart_id, product_id, quantity)
          VALUES ($1, $2, $3)
          RETURNING *
        `, [cartId, productId, quantity]);

        return newItem.rows[0];
      }
    });

    res.json({
      success: true,
      data: { 
        cartItem: result,
        message: `${product.name} added to cart`
      }
    });

  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add item to cart'
    });
  }
};

// Update cart item quantity
const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (quantity === 0) {
      return removeFromCart(req, res);
    }

    const result = await transaction(async (client) => {
      // Verify cart item belongs to user
      const cartItemResult = await client.query(`
        SELECT ci.id, ci.product_id, ci.quantity, p.stock_quantity, p.name
        FROM cart_items ci
        JOIN cart c ON ci.cart_id = c.id
        JOIN products p ON ci.product_id = p.id
        WHERE ci.id = $1 AND c.user_id = $2
      `, [itemId, userId]);

      if (cartItemResult.rows.length === 0) {
        throw new Error('Cart item not found');
      }

      const cartItem = cartItemResult.rows[0];

      // Check stock availability
      if (quantity > cartItem.stock_quantity) {
        throw new Error(`Only ${cartItem.stock_quantity} items available in stock`);
      }

      // Update quantity
      const updatedItem = await client.query(`
        UPDATE cart_items 
        SET quantity = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `, [quantity, itemId]);

      return { item: updatedItem.rows[0], productName: cartItem.name };
    });

    res.json({
      success: true,
      data: { 
        cartItem: result.item,
        message: `${result.productName} quantity updated`
      }
    });

  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update cart item'
    });
  }
};

// Remove item from cart
const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;

    const result = await transaction(async (client) => {
      // Verify cart item belongs to user and get product name
      const cartItemResult = await client.query(`
        SELECT ci.id, p.name
        FROM cart_items ci
        JOIN cart c ON ci.cart_id = c.id
        JOIN products p ON ci.product_id = p.id
        WHERE ci.id = $1 AND c.user_id = $2
      `, [itemId, userId]);

      if (cartItemResult.rows.length === 0) {
        throw new Error('Cart item not found');
      }

      const productName = cartItemResult.rows[0].name;

      // Remove item
      await client.query(`DELETE FROM cart_items WHERE id = $1`, [itemId]);

      return { productName };
    });

    res.json({
      success: true,
      message: `${result.productName} removed from cart`
    });

  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to remove item from cart'
    });
  }
};

// Clear entire cart
const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;

    await transaction(async (client) => {
      // Get cart ID
      const cartResult = await client.query(`
        SELECT id FROM cart WHERE user_id = $1
      `, [userId]);

      if (cartResult.rows.length > 0) {
        const cartId = cartResult.rows[0].id;
        
        // Remove all items
        await client.query(`DELETE FROM cart_items WHERE cart_id = $1`, [cartId]);
      }
    });

    res.json({
      success: true,
      message: 'Cart cleared successfully'
    });

  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cart'
    });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
};