        // Simple cart functionality
        let cart = [];
        
        document.querySelectorAll('.add-to-cart').forEach(button => {
            button.addEventListener('click', function() {
                const productCard = this.closest('.product-card');
                const productName = productCard.querySelector('h3').textContent;
                const productPrice = productCard.querySelector('.current-price').textContent;
                
                cart.push({ name: productName, price: productPrice });
                
                // Visual feedback
                this.textContent = 'Tillagd!';
                this.style.background = '#7CB342';
                
                setTimeout(() => {
                    this.textContent = 'Lägg i kundvagn';
                    this.style.background = '#2B4C8C';
                }, 2000);
                
                console.log('Cart:', cart);
            });
        });

        // Wishlist functionality
        document.querySelectorAll('.wishlist-btn').forEach(button => {
            button.addEventListener('click', function() {
                this.style.color = this.style.color === 'rgb(255, 107, 157)' ? '#333' : '#ff6b9d';
                this.style.borderColor = this.style.borderColor === 'rgb(255, 107, 157)' ? '#e0e0e0' : '#ff6b9d';
                this.textContent = this.textContent === '♡' ? '❤️' : '♡';
            });
        });

        // Search functionality
        document.querySelector('.search-btn').addEventListener('click', function() {
            const query = document.querySelector('.search-input').value;
            if (query) {
                alert('Söker efter: ' + query);
            }
        });

        document.querySelector('.search-input').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const query = this.value;
                if (query) {
                    alert('Söker efter: ' + query);
                }
            }
        });

        // Smooth scrolling for anchor links