// Shared helpers
(function () {
	const yearEl = document.getElementById('year');
	if (yearEl) yearEl.textContent = new Date().getFullYear().toString();

	const fmt = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });

	function toGrams(value, unit) {
		const v = Number(value) || 0;
		switch (unit) {
			case 'mg':
				return v / 1000; // mg to g
			case 'kg':
				return v * 1000; // kg to g
			default:
				return v; // g
		}
	}

	function goldPurityFraction(karat) {
		const k = Number(karat) || 24;
		return k / 24;
	}

		function percentToMultiplier(pct) {
			const p = Number(pct) || 0;
			return 1 + p / 100;
		}

	function formatMoney(num) {
		if (Number.isNaN(num)) return '-';
		return fmt.format(num);
	}

	// --- Daily Live Rate persistence helpers ---
	function todayKeyDate() {
		const d = new Date();
		return d.toISOString().slice(0, 10); // YYYY-MM-DD
	}

	function loadDailyRate(keyBase) {
		try {
			const raw = localStorage.getItem(keyBase);
			if (!raw) return 0;
			const parsed = JSON.parse(raw);
			if (!parsed || !parsed.date || typeof parsed.rate !== 'number') return 0;
			if (parsed.date !== todayKeyDate()) {
				// stale
				return 0;
			}
			return parsed.rate;
		} catch (e) {
			return 0;
		}
	}

	function saveDailyRate(keyBase, rate) {
		try {
			const payload = { rate: Number(rate) || 0, date: todayKeyDate() };
			localStorage.setItem(keyBase, JSON.stringify(payload));
		} catch (e) {
			// ignore
		}
	}

	// Keys: bhama_rate_gold, bhama_rate_silver

	// Gold form
	const goldForm = document.getElementById('gold-form');
						// Load cart from storage
						let cart = [];
						try {
							const saved = localStorage.getItem('bhama_cart');
							if (saved) cart = JSON.parse(saved);
						} catch {}
					function updateCartCount() {
					const cartCount = document.getElementById('cart-count');
					if (cartCount) cartCount.textContent = cart.length;
				}
					function showCart() {
						const cartSection = document.getElementById('cart-section');
						const cartList = document.getElementById('cart-list');
						if (!cartSection || !cartList) return;
						if (cart.length) cartSection.classList.remove('hidden');
						else cartSection.classList.add('hidden');
						updateCartCount();
						cartList.innerHTML = '';
						cart.forEach((item, idx) => {
							const li = document.createElement('li');
							const laborText = item.type === 'gold' && typeof item.labor !== 'undefined' ? `, Labor: ${Number(item.labor).toFixed(2)}%` : '';
							const addText = item.type === 'gold' && typeof item.additional !== 'undefined' && Number(item.additional) > 0 ? `, Additional: ₹${Number(item.additional).toFixed(2)}` : '';
							li.textContent = `#${idx+1}: ${item.weight}g, Purity: ${(item.purity*100).toFixed(1)}%, Rate: ₹${item.rate}/g, Making: ₹${item.making}/g${laborText}${addText}, Total: ₹${item.total}`;
							cartList.appendChild(li);
						});
							// Persist
							try { localStorage.setItem('bhama_cart', JSON.stringify(cart)); } catch {}

							// Render drawer list too
							const drawerList = document.getElementById('drawer-list');
							if (drawerList) {
								drawerList.innerHTML = '';
								cart.forEach((item, idx) => {
									const div = document.createElement('div');
									div.className = 'cart-drawer-item';
									const itemType = item.type === 'silver' ? 'Silver' : 'Gold';
									const purityText = item.type === 'silver' ? 'N/A' : (item.purity*100).toFixed(1) + '%';
									const laborText = item.type === 'gold' && typeof item.labor !== 'undefined' ? ` • L:${Number(item.labor).toFixed(2)}%` : '';
									const addText = item.type === 'gold' && typeof item.additional !== 'undefined' && Number(item.additional) > 0 ? ` • Add: ₹${Number(item.additional).toFixed(2)}` : '';
									div.textContent = `#${idx+1}: ${itemType} • ${item.weight}g • Purity: ${purityText} • ₹${item.rate}/g${laborText}${addText} • Total: ₹${item.total}`;
									drawerList.appendChild(div);
								});
								if (!cart.length) {
									const empty = document.createElement('div');
									empty.textContent = 'Your cart is empty.';
									drawerList.appendChild(empty);
								}
							}
					}

				function showAddToCart() {
					const cartActions = document.getElementById('cart-actions');
					if (cartActions) cartActions.classList.remove('hidden');
				}
				function hideAddToCart() {
					const cartActions = document.getElementById('cart-actions');
					if (cartActions) cartActions.classList.add('hidden');
				}

			if (goldForm) {
			// Optional: Fetch live rate from an API endpoint (you can replace this URL)
			const fetchBtn = document.getElementById('gold-fetch');
				if (fetchBtn) {
					fetchBtn.addEventListener('click', async () => {
								const input = document.getElementById('gold-rate');
								fetchBtn.disabled = true; fetchBtn.textContent = 'Fetching…';
								const origValue = input.value;
								input.value = '';
								input.placeholder = 'Loading…';
								let lastRate = null;
								try {
									// Use metalpriceapi.com for live gold rate in INR
									const apiKey = '21c9b582b92fac66e8b1038d58a80828';
									  const url = `https://api.metalpriceapi.com/v1/latest?api_key=${apiKey}&base=INR&currencies=XAU`;
									  const corsUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
									  const res = await fetch(corsUrl, { cache: 'no-store' });
									  if (!res.ok) throw new Error('Network error');
									  const data = await res.json();
									  console.log('MetalPriceAPI response:', data);
									// XAU is per troy ounce; convert to grams (1 troy ounce = 31.1034768 grams)
												if (data && data.rates && typeof data.rates.XAU === 'number') {
													const inrPerOunce = data.rates.XAU;
													const inrPerGram = inrPerOunce / 31.1034768;
													lastRate = inrPerGram;
													input.value = inrPerGram.toFixed(2);
													// persist today's gold rate
													saveDailyRate('bhama_rate_gold', Number(inrPerGram) || 0);
													input.placeholder = 'e.g., 6200';
													let info = document.getElementById('gold-rate-info');
													if (!info) {
														info = document.createElement('div');
														info.id = 'gold-rate-info';
														info.style.color = '#eab308';
														info.style.fontSize = '0.95em';
														input.parentNode.parentNode.appendChild(info);
													}
													info.textContent = `Last fetched rate: ₹${inrPerGram.toFixed(2)} per gram (INR)`;
													if (inrPerGram === 0) {
														info.textContent += ' (Warning: API returned 0.00, check API key or quota)';
													}
													// Debug: show raw API response if rate is 0 or missing
													if (inrPerGram === 0 || !isFinite(inrPerGram)) {
														info.textContent += `\nRaw API response: ${JSON.stringify(data)}`;
													}
												} else {
													let info = document.getElementById('gold-rate-info');
													if (!info) {
														info = document.createElement('div');
														info.id = 'gold-rate-info';
														info.style.color = '#ef4444';
														info.style.fontSize = '0.95em';
														input.parentNode.parentNode.appendChild(info);
													}
													info.textContent = 'Invalid API response. Please check your API key or quota.';
													input.value = origValue;
													input.placeholder = 'e.g., 6200';
												}
								} catch (err) {
									input.value = origValue;
									input.placeholder = 'e.g., 6200';
									let info = document.getElementById('gold-rate-info');
									if (!info) {
										info = document.createElement('div');
										info.id = 'gold-rate-info';
										info.style.color = '#ef4444';
										info.style.fontSize = '0.95em';
										input.parentNode.parentNode.appendChild(info);
									}
									info.textContent = 'Could not fetch live rate. Please enter manually.';
								} finally {
									fetchBtn.disabled = false; fetchBtn.textContent = 'Fetch Live Rate';
								}
					});
				}

				// Preload stored daily rate for gold
				(function preloadGoldRate() {
					const input = document.getElementById('gold-rate');
					if (!input) return;
					const saved = loadDailyRate('bhama_rate_gold');
					if (saved && Number(saved) > 0) {
						input.value = Number(saved).toFixed(2);
						let info = document.getElementById('gold-rate-info');
						if (!info) {
							info = document.createElement('div');
							info.id = 'gold-rate-info';
							info.style.color = '#eab308';
							info.style.fontSize = '0.95em';
							input.parentNode.parentNode.appendChild(info);
						}
						info.textContent = `Using stored rate for ${todayKeyDate()}: ₹${Number(saved).toFixed(2)} per gram`;
					}

					// Save when user edits the input manually
					input.addEventListener('change', () => {
						const val = Number(input.value) || 0;
						saveDailyRate('bhama_rate_gold', val);
					});
				})();

				// Clear today's stored gold rate when user clicks clear
				const goldClearBtn = document.getElementById('gold-clear-rate');
				if (goldClearBtn) {
					goldClearBtn.addEventListener('click', () => {
						try { localStorage.removeItem('bhama_rate_gold'); } catch (e) {}
						const input = document.getElementById('gold-rate');
						if (input) input.value = '';
						const info = document.getElementById('gold-rate-info');
						if (info) info.remove();
					});
				}

		goldForm.addEventListener('submit', function (e) {
			e.preventDefault();

			const weight = Number(goldForm.querySelector('#gold-weight')?.value || 0);
			const purity = Number(goldForm.querySelector('#gold-karat')?.value || 0); // This is already a decimal fraction
			const rate = Number(goldForm.querySelector('#gold-rate')?.value || 0);
			const makingValue = goldForm.querySelector('#gold-making')?.value;
			const makingPerGram = makingValue === '' ? 0 : Number(makingValue);
			const laborPercent = Number(goldForm.querySelector('#gold-labor')?.value || 0);
			const additionalCharge = Number(goldForm.querySelector('#gold-additional')?.value || 0);

			const grams = Number.isFinite(weight) ? weight : 0; // already grams
			const P = purity; // Already decimal fraction
			const LR = rate;
			const W = grams;
			const E = makingPerGram;
			const Lpct = Number(laborPercent) || 0;
			const L = Lpct / 100; // convert percent to multiplier fraction
			// Updated formula: (LR*P*W) + (LR*P*W)*L + (W*E)
			const subtotal = LR * P * W;
			const laborAmount = subtotal * L;
			const makingTotal = E * W;
			const finalPrice = subtotal + laborAmount + makingTotal + (Number(additionalCharge) || 0);

								const result = document.getElementById('gold-result');
								result.innerHTML = `
									<div>LR: <strong>${formatMoney(LR)}</strong> per gram</div>
									<div>P (purity): <strong>${(P * 100).toFixed(1)}%</strong></div>
									<div>W (weight): <strong>${formatMoney(W)}</strong> g</div>
									<div>E (making): <strong>${formatMoney(E)}</strong> per gram</div>
									<div>L (labor): <strong>${(Lpct).toFixed(2)}%</strong></div>
									<hr style="border: none; border-top: 1px solid #1f2937; margin: 8px 0;" />
									<div>Subtotal (LR*P*W): <strong>${formatMoney(subtotal)}</strong></div>
									<div>Labor (${(Lpct).toFixed(2)}%): <strong>${formatMoney(laborAmount)}</strong></div>
									<div>Making (E*W): <strong>${formatMoney(makingTotal)}</strong></div>
									<div>Additional charges: <strong>₹${formatMoney(additionalCharge)}</strong></div>
									<div class="value" style="font-size:1.25rem; margin-top:6px;">Estimated Price: ${formatMoney(finalPrice)}</div>
								`;
								showAddToCart();
		// Add to Cart button logic
		const addToCartBtn = document.getElementById('add-to-cart');
		if (addToCartBtn) {
		addToCartBtn.onclick = function() {
			// Get current calculation values
			const weight = Number(goldForm.querySelector('#gold-weight').value);
			const purity = Number(goldForm.querySelector('#gold-karat').value);
			const rate = Number(goldForm.querySelector('#gold-rate').value);
			const makingValue = goldForm.querySelector('#gold-making').value;
			const making = makingValue === '' ? 0 : Number(makingValue);
			const laborValue = Number(goldForm.querySelector('#gold-labor')?.value || 0);
			const additionalValue = Number(goldForm.querySelector('#gold-additional')?.value || 0);
			const subtotal2 = rate * purity * weight;
			const laborAmt = subtotal2 * (laborValue / 100);
			const makingTotal2 = making * weight;
			const total = subtotal2 + laborAmt + makingTotal2 + additionalValue;
			cart.push({ weight, purity, rate, making, labor: laborValue, additional: additionalValue, total, type: 'gold' });
			// Persist today's gold rate so the input remains filled
			saveDailyRate('bhama_rate_gold', rate);
			showCart();
			updateCartCount();
			hideAddToCart();
			// Reset form but keep the rate input populated
			goldForm.reset();
			const rateInput = document.getElementById('gold-rate');
			if (rateInput && Number(rate)) {
				rateInput.value = Number(rate).toFixed(2);
				let info = document.getElementById('gold-rate-info');
				if (!info) {
					info = document.createElement('div');
					info.id = 'gold-rate-info';
					info.style.color = '#eab308';
					info.style.fontSize = '0.95em';
					rateInput.parentNode.parentNode.appendChild(info);
				}
				info.textContent = `Using stored rate for ${todayKeyDate()}: ₹${Number(rate).toFixed(2)} per gram`;
			}
			document.getElementById('gold-result').innerHTML = '';
			};
		}
			});
		}

		// Cart header button logic (register on load, not inside other handlers)
		const cartHeaderBtn = document.getElementById('cart-header-btn');
		if (cartHeaderBtn) {
				cartHeaderBtn.onclick = function() {
					// Open drawer
					const drawer = document.getElementById('cart-drawer');
					const overlay = document.getElementById('overlay');
					if (drawer && overlay) {
						drawer.classList.remove('hidden');
						overlay.classList.remove('hidden');
						// force animate
						requestAnimationFrame(() => drawer.classList.add('open'));
					}
				};
		}

			// Close drawer
			const drawerClose = document.getElementById('drawer-close');
			const overlayEl = document.getElementById('overlay');
			function closeDrawer() {
				const drawer = document.getElementById('cart-drawer');
				const overlay = document.getElementById('overlay');
				if (drawer && overlay) {
					drawer.classList.remove('open');
					setTimeout(() => {
						drawer.classList.add('hidden');
						overlay.classList.add('hidden');
					}, 180);
				}
			}
			if (drawerClose) drawerClose.onclick = closeDrawer;
			if (overlayEl) overlayEl.onclick = closeDrawer;

			// Initial render
			showCart();
			updateCartCount();

				// Full cart page logic
				const fullCartList = document.getElementById('full-cart-list');
				const fullCartEmpty = document.getElementById('full-cart-empty');
				const fullCartSummary = document.getElementById('full-cart-summary');
				const clearCartBtn = document.getElementById('clear-cart');

				function renderFullCart() {
					if (!fullCartList || !fullCartEmpty || !fullCartSummary) return;
					fullCartList.innerHTML = '';
					if (!cart.length) {
						fullCartEmpty.classList.remove('hidden');
						fullCartSummary.classList.add('hidden');
						updateCartCount();
						return;
					}
					fullCartEmpty.classList.add('hidden');
					let grand = 0;
                        cart.forEach((item, idx) => {
						grand += Number(item.total) || 0;
						const row = document.createElement('div');
						row.className = 'full-cart-item';
						const left = document.createElement('div');
						const nameInput = document.createElement('input');
						nameInput.type = 'text';
						nameInput.placeholder = 'Item name (optional)';
						nameInput.value = item.name || '';
						nameInput.onchange = () => {
							cart[idx].name = nameInput.value.trim();
							try { localStorage.setItem('bhama_cart', JSON.stringify(cart)); } catch {}
						};
						const meta = document.createElement('div');
						meta.className = 'full-cart-meta';
						const itemType = item.type === 'silver' ? 'Silver' : 'Gold';
						const purityText = item.type === 'silver' ? 'N/A' : (item.purity*100).toFixed(1) + '%';
						const laborMeta = item.type === 'gold' && typeof item.labor !== 'undefined' ? ` • Labor: ${Number(item.labor).toFixed(2)}%` : '';
						const addMeta = item.type === 'gold' && typeof item.additional !== 'undefined' && Number(item.additional) > 0 ? ` • Add: ₹${Number(item.additional).toFixed(2)}` : '';
						meta.textContent = `${itemType} • ${item.weight}g • Purity: ${purityText} • ₹${item.rate}/g${laborMeta}${addMeta}`;
						left.appendChild(nameInput);
						left.appendChild(meta);
						const right = document.createElement('div');
						right.className = 'full-cart-actions';
						const totalEl = document.createElement('div');
						totalEl.textContent = `₹${(Number(item.total)||0).toFixed(2)}`;
						const removeBtn = document.createElement('button');
						removeBtn.className = 'btn btn-ghost';
						removeBtn.textContent = 'Remove';
						removeBtn.onclick = () => {
							cart.splice(idx, 1);
							try { localStorage.setItem('bhama_cart', JSON.stringify(cart)); } catch {}
							showCart();
							updateCartCount();
							renderFullCart();
						};
						right.appendChild(totalEl);
						right.appendChild(removeBtn);
						row.appendChild(left);
						row.appendChild(right);
						fullCartList.appendChild(row);
					});
					fullCartSummary.classList.remove('hidden');
					fullCartSummary.innerHTML = `<strong>Total:</strong> ₹${grand.toFixed(2)}`;
					updateCartCount();
					
					// Show invoice details section when cart has items
					const invoiceDetails = document.getElementById('invoice-details');
					if (invoiceDetails) {
						invoiceDetails.classList.remove('hidden');
						// Set default invoice number and date with time
						const invoiceNumberInput = document.getElementById('invoice-number');
						const invoiceDateInput = document.getElementById('invoice-date');
						if (invoiceNumberInput && !invoiceNumberInput.value) {
							invoiceNumberInput.value = 'INV-' + Date.now();
						}
						if (invoiceDateInput && !invoiceDateInput.value) {
							const now = new Date();
							const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
							const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
							invoiceDateInput.value = `${dateStr} ${timeStr}`;
						}
					}
				}

				if (clearCartBtn) {
					clearCartBtn.onclick = () => {
						cart = [];
						try { localStorage.setItem('bhama_cart', JSON.stringify(cart)); } catch {}
						showCart();
						renderFullCart();
						// Hide invoice details when cart is cleared
						const invoiceDetails = document.getElementById('invoice-details');
						if (invoiceDetails) invoiceDetails.classList.add('hidden');
					};
				}

				// If on cart page, render
				renderFullCart();

	// Silver form
		const silverForm = document.getElementById('silver-form');
		if (silverForm) {

			// Preload stored daily rate for silver
			(function preloadSilverRate() {
				const input = document.getElementById('silver-rate');
				if (!input) return;
				const saved = loadDailyRate('bhama_rate_silver');
				if (saved && Number(saved) > 0) {
					input.value = Number(saved).toFixed(2);
					let info = document.getElementById('silver-rate-info');
					if (!info) {
						info = document.createElement('div');
						info.id = 'silver-rate-info';
						info.style.color = '#eab308';
						info.style.fontSize = '0.95em';
						input.parentNode.parentNode.appendChild(info);
					}
					info.textContent = `Using stored rate for ${todayKeyDate()}: ₹${Number(saved).toFixed(2)} per gram`;
				}

				// Save when user edits the input manually
				input.addEventListener('change', () => {
					const val = Number(input.value) || 0;
					saveDailyRate('bhama_rate_silver', val);
				});
			})();

			// Clear today's stored silver rate when user clicks clear
			const silverClearBtn = document.getElementById('silver-clear-rate');
			if (silverClearBtn) {
				silverClearBtn.addEventListener('click', () => {
					try { localStorage.removeItem('bhama_rate_silver'); } catch (e) {}
					const input = document.getElementById('silver-rate');
					if (input) input.value = '';
					const info = document.getElementById('silver-rate-info');
					if (info) info.remove();
				});
			}

			// Auto-set making charge based on type
			const typeSelect = silverForm.querySelector('#silver-type');
			const makingInput = silverForm.querySelector('#silver-making');
			if (typeSelect && makingInput) {
				// Set initial value based on default selection
				function updateMakingCharge() {
					if (typeSelect.value === 'coin') {
						makingInput.value = 30;
					} else if (typeSelect.value === 'ornament') {
						makingInput.value = 20;
					} else if (typeSelect.value === 'free') {
						// For 'free' type, clear the field so user enters custom percentage
						makingInput.value = '';
					}
				}
				
				// Set initial value on page load
				updateMakingCharge();
				
				// Update when type changes
				typeSelect.addEventListener('change', updateMakingCharge);
			}

			silverForm.addEventListener('submit', function (e) {
				e.preventDefault();
				const weight = silverForm.querySelector('#silver-weight').value;
				const unit = silverForm.querySelector('#silver-weight-unit').value;
				const purity = 1.0; // Always 100%
				const rate = Number(silverForm.querySelector('#silver-rate').value);
				const making = silverForm.querySelector('#silver-making').value;
				const additional = silverForm.querySelector('#silver-additional').value;

			const grams = toGrams(weight, unit);
			// Formula: (LR*W)*L + Additional
			// where LR = rate, W = grams, L = labor percentage (making)
			const base = rate * grams;
			const withMaking = base * percentToMultiplier(making);
			const additionalAmount = Number(additional) || 0;
			const finalPrice = withMaking + additionalAmount;				const result = document.getElementById('silver-result');
				const typeLabel = typeSelect.value === 'coin' ? 'Coin (30% making)' : 
				                 typeSelect.value === 'ornament' ? 'Ornament (20% making)' : 
				                 `Free (${Number(making)}% making)`;
				
				result.innerHTML = `
					<div>Weight: <strong>${formatMoney(grams)}</strong> g @ ${formatMoney(rate)} /g</div>
					<div>Purity: <strong>100%</strong></div>
					<div>Type: <strong>${typeLabel}</strong></div>
					<div>Subtotal (LR×W): <strong>${formatMoney(base)}</strong></div>
					<div>After making/labor (×${Number(making)}%): <strong>${formatMoney(withMaking)}</strong></div>
					${additionalAmount > 0 ? `<div>Additional charges: <strong>${formatMoney(additionalAmount)}</strong></div>` : ''}
					<div class="value" style="font-size:1.25rem; margin-top:6px;">Estimated Price: ${formatMoney(finalPrice)}</div>
				`;
				showAddToCart();
				
				// Add to Cart button logic for silver
				const addToCartBtn = document.getElementById('add-to-cart');
				if (addToCartBtn) {
					addToCartBtn.onclick = function() {
						// Get current calculation values
						const weight = Number(silverForm.querySelector('#silver-weight').value);
						const unit = silverForm.querySelector('#silver-weight-unit').value;
						const purity = 1.0;
						const rate = Number(silverForm.querySelector('#silver-rate').value);
						const making = Number(silverForm.querySelector('#silver-making').value) || 0;
					const grams = toGrams(weight, unit);
					const base = grams * rate * purity;
					const withMaking = base * percentToMultiplier(making);
					const additionalValue = Number(silverForm.querySelector('#silver-additional').value) || 0;
					const total = withMaking + additionalValue;						cart.push({ 
							weight: grams, 
							purity: purity, 
							rate: rate, 
							making: making, 
							total: total,
							type: 'silver'
						});
						showCart();
						updateCartCount();
						hideAddToCart();
						silverForm.reset();
						document.getElementById('silver-result').innerHTML = '';
					};
				}
			});
		}
})();

// --- PDF Invoice Generation ---
document.addEventListener('DOMContentLoaded', function() {
	// Access cart from localStorage
	let cart = [];
	try {
		const saved = localStorage.getItem('bhama_cart');
		if (saved) cart = JSON.parse(saved);
	} catch {}

	const downloadBtn = document.getElementById('download-invoice');
	if (!downloadBtn) return;
	
	downloadBtn.onclick = async function() {
		// Re-read cart to ensure it's current
		try {
			const saved = localStorage.getItem('bhama_cart');
			if (saved) cart = JSON.parse(saved);
		} catch {}
		
		if (!cart.length) {
			alert('Cart is empty. Add items before downloading invoice.');
			return;
		}
		
		// Get invoice details from input fields
		const invoiceNumber = document.getElementById('invoice-number')?.value || 'INV-' + Date.now();
		// Get system date and time
		const now = new Date();
		const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
		const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
		const invoiceDate = document.getElementById('invoice-date')?.value || `${dateStr} ${timeStr}`;
		const billedTo = document.getElementById('billed-to')?.value || 'Customer Name';
		const billedNumber = document.getElementById('billed-phone')?.value || '';
		
		// Validate required fields
		if (!billedTo || billedTo === 'Customer Name') {
			alert('Please enter customer name in "Billed To" field.');
			document.getElementById('billed-to')?.focus();
			return;
		}
		
		// jsPDF
		const { jsPDF } = window.jspdf;
		const doc = new jsPDF();
		
		// Page dimensions
		const pageWidth = doc.internal.pageSize.getWidth();
		const pageHeight = doc.internal.pageSize.getHeight();
		
		// Add border around page
		doc.setDrawColor(200, 200, 200);
		doc.setLineWidth(0.5);
		doc.rect(5, 5, pageWidth - 10, pageHeight - 10);
		
		// Add logo (top left)
		// First try to use the <img class="logo-img"> already loaded on the page. This avoids CORS/tainted-canvas issues
		let logoRendered = false;
		try {
			const domImg = document.querySelector('.logo-img');
			if (domImg && domImg.complete && domImg.naturalWidth) {
				try {
					const canvasEl = document.createElement('canvas');
					canvasEl.width = domImg.naturalWidth;
					canvasEl.height = domImg.naturalHeight;
					const ctx = canvasEl.getContext('2d');
					ctx.drawImage(domImg, 0, 0);
					const dataUrl = canvasEl.toDataURL('image/png');
					doc.addImage(dataUrl, 'PNG', 15, 15, 35, 35);
					logoRendered = true;
				} catch (errCanvas) {
					console.warn('Could not draw DOM logo to canvas:', errCanvas);
				}
			}
		} catch (errDom) {
			// ignore and try next method
		}

        if (!logoRendered) {
            // Fall back to loading the image via helper (may fail under file:// depending on browser)
            try {
                const logoImg = await loadImageAsBase64('Logo.png');
                if (logoImg) {
                    doc.addImage(logoImg, 'PNG', 15, 15, 35, 35);
                    logoRendered = true;
                } else {
                    throw new Error('Empty image data');
                }
            } catch (e) {
                // If image load fails, log and render company name as fallback
                console.warn('Logo not loaded for PDF, rendering text fallback. Reason:', e && e.message ? e.message : e);
                doc.setFontSize(14);
                doc.setFont(undefined, 'bold');
                doc.text('Divika Jewellers', 18, 32);
            }
        }	// Company name and title
	doc.setFontSize(20);
	doc.setFont(undefined, 'bold');
	doc.text('Divika Jewellers Invoice', 60, 28);
		
		// Horizontal line under header
		doc.setDrawColor(234, 179, 8); // Amber color
		doc.setLineWidth(1);
		doc.line(15, 55, pageWidth - 15, 55);
		
		// Invoice info (right side)
		doc.setFontSize(10);
		doc.setFont(undefined, 'normal');
		doc.text('Invoice #: ' + invoiceNumber, pageWidth - 15, 25, { align: 'right' });
		doc.text('Date: ' + invoiceDate, pageWidth - 15, 32, { align: 'right' });
		
		// Billed to section
		doc.setFontSize(10);
		doc.setFont(undefined, 'bold');
		doc.text('BILLED TO:', 15, 65);
		doc.setFont(undefined, 'normal');
		doc.setFontSize(11);
		doc.text(billedTo, 15, 72);
		if (billedNumber) doc.text('Phone: ' + billedNumber, 15, 79);
		
		// Table header with background
		let y = 95;
		doc.setFillColor(234, 179, 8); // Amber background
		doc.rect(15, y - 6, pageWidth - 30, 8, 'F');
		
		doc.setFontSize(10);
		doc.setFont(undefined, 'bold');
		doc.setTextColor(0, 0, 0);
		doc.text('No.', 18, y);
		doc.text('Item Name', 35, y);
		doc.text('Type', 75, y);
		doc.text('Weight (g)', 100, y);
		doc.text('Purity', 130, y);
		doc.text('Rate/g', 155, y);
		doc.text('Total', pageWidth - 15, y, { align: 'right' });
		
		// Table divider line
		y += 3;
		doc.setDrawColor(200, 200, 200);
		doc.setLineWidth(0.3);
		doc.line(15, y, pageWidth - 15, y);
		
		// Table rows
		y += 8;
		doc.setFont(undefined, 'normal');
		doc.setFontSize(10);
		
		let grandTotal = 0;
		cart.forEach((item, idx) => {
			grandTotal += Number(item.total) || 0;
			
			// Alternate row background
			if (idx % 2 === 0) {
				doc.setFillColor(245, 245, 245);
				doc.rect(15, y - 5, pageWidth - 30, 8, 'F');
			}
			
			doc.setTextColor(0, 0, 0);
			doc.text(String(idx + 1), 18, y);
			doc.text(item.name || 'Item ' + String(idx + 1), 35, y);
			
			// Type column (Gold/Silver)
			const itemType = item.type === 'silver' ? 'Silver' : 'Gold';
			doc.text(itemType, 75, y);
			
			doc.text(String(item.weight), 100, y);
			
			// Purity column (show percentage for gold, "-" for silver)
			const purityText = item.type === 'silver' ? '-' : (item.purity * 100).toFixed(1) + '%';
			doc.text(purityText, 130, y);
			
			doc.text('Rs. ' + Number(item.rate).toFixed(0), 155, y);
			doc.text('Rs. ' + (Number(item.total) || 0).toFixed(2), pageWidth - 15, y, { align: 'right' });
			
			y += 10;
		});
		
		// Total section with background
		y += 5;
		doc.setFillColor(240, 240, 240);
		doc.rect(15, y - 5, pageWidth - 30, 12, 'F');
		
		doc.setFontSize(14);
		doc.setFont(undefined, 'bold');
		doc.setTextColor(0, 0, 0);
		doc.text('Grand Total:', 18, y + 3);
		doc.setFontSize(16);
		doc.setTextColor(234, 179, 8); // Amber color
		doc.text('Rs. ' + grandTotal.toFixed(2), pageWidth - 15, y + 3, { align: 'right' });
		
		// Footer section
		y = pageHeight - 40;
		doc.setDrawColor(234, 179, 8);
		doc.setLineWidth(0.5);
		doc.line(15, y, pageWidth - 15, y);
		
		doc.setFontSize(10);
		doc.setFont(undefined, 'italic');
		doc.setTextColor(100, 100, 100);
	doc.text('Thank you for shopping with Divika Jewellers!', pageWidth / 2, y + 8, { align: 'center' });
		doc.setFontSize(8);
		doc.text('For any queries, please contact us.', pageWidth / 2, y + 14, { align: 'center' });
		
	// Company address and contact
	doc.setFont(undefined, 'normal');
	doc.setFontSize(8);
	doc.setTextColor(80, 80, 80);
	doc.text('Shop no.7, Moolraj Inter College, Ramnagar Roorkee - 247667', pageWidth / 2, y + 18, { align: 'center' });
	doc.text('Contact: 7505715707  |  Alternate: 8077259199', pageWidth / 2, y + 24, { align: 'center' });
		
		// Copyright
		doc.setFontSize(7);
		doc.setTextColor(120, 120, 120);
	doc.text('© ' + new Date().getFullYear() + ' Divika Jewellers. All rights reserved.', pageWidth / 2, y + 32, { align: 'center' });
		
		doc.save(invoiceNumber + '.pdf');
	};
});

// Helper: Load image as base64
function loadImageAsBase64(url) {
	return new Promise((resolve, reject) => {
		const img = new window.Image();
		img.crossOrigin = 'anonymous';
		img.onload = function() {
			const canvas = document.createElement('canvas');
			canvas.width = img.width;
			canvas.height = img.height;
			const ctx = canvas.getContext('2d');
			ctx.drawImage(img, 0, 0);
			resolve(canvas.toDataURL('image/png'));
		};
		img.onerror = reject;
		img.src = url;
	});
}
