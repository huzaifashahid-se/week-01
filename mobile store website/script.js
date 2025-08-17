/* Shared JS for AneesMobile
  - Page transition loader
  - Neon cursor
  - Cart via localStorage
  - Tilt effect for product cards
  - Contact form validation
  - Small micro animations and event wiring
*/
document.addEventListener('DOMContentLoaded', ()=>{

  // Page loader overlay
  const loader = document.querySelector('.loading-overlay');
  function showLoader(ms=700){
    if(!loader) return;
    loader.classList.add('show');
    return new Promise(res => setTimeout(()=>{loader.classList.remove('show'); res()}, ms));
  }

  // Intercept nav links for transition
  document.querySelectorAll('a[data-nav]').forEach(a=>{
    a.addEventListener('click', async (e)=>{
      const href = a.getAttribute('href');
      if(!href || href.startsWith('#')) return;
      e.preventDefault();
      await showLoader(700);
      window.location.href = href;
    });
  });

  // neon custom cursor
  const cur = document.createElement('div'); cur.className='cursor'; document.body.appendChild(cur);
  window.addEventListener('mousemove', (e)=>{
    cur.style.left = e.clientX + 'px';
    cur.style.top = e.clientY + 'px';
  });
  // enlarge when hovering buttons
  document.querySelectorAll('button, a, .buy-btn, .prod-img svg').forEach(el=>{
    el.addEventListener('mouseenter', ()=>{ cur.style.transform='translate(-50%,-50%) scale(1.8)'; cur.style.opacity='0.95' })
    el.addEventListener('mouseleave', ()=>{ cur.style.transform='translate(-50%,-50%) scale(1)'; cur.style.opacity='1' })
  });

  // Product tilt effect (mouse)
  document.querySelectorAll('.card').forEach(card=>{
    const inner = card.querySelector('.card-inner');
    card.addEventListener('mousemove', (e)=>{
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      const rotY = (px - 0.5) * 14;
      const rotX = -(py - 0.5) * 10;
      inner.style.transform = `rotateY(${rotY}deg) rotateX(${rotX}deg) translateZ(8px)`;
    });
    card.addEventListener('mouseleave', ()=>{ inner.style.transform = ''});
  });

  // Simple cart
  const CART_KEY = 'anees_cart_v1';
  function getCart(){ try { return JSON.parse(localStorage.getItem(CART_KEY)) || [] } catch { return [] } }
  function saveCart(cart){ localStorage.setItem(CART_KEY, JSON.stringify(cart)); updateCartBadge(); }
  function addToCart(item){
    const cart = getCart();
    const idx = cart.findIndex(c => c.id === item.id);
    if(idx>-1) cart[idx].qty += item.qty || 1;
    else cart.push({...item, qty: item.qty || 1});
    saveCart(cart);
    showToast(`${item.title} added to cart`);
  }
  function updateCartBadge(){
    const el = document.querySelector('#cart-count');
    if(!el) return;
    const total = getCart().reduce((s,i)=>s+i.qty,0);
    el.textContent = total || '';
  }
  // attach buy buttons
  document.querySelectorAll('.buy-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const p = btn.closest('.card');
      const id = p.dataset.id || Math.random().toString(36).slice(2,9);
      const title = p.querySelector('.prod-title').textContent.trim();
      const priceText = (p.querySelector('.prod-price')||{}).textContent || '0';
      const price = parseFloat(priceText.replace(/[^\d.]/g,'')) || 0;
      addToCart({id,title,price,qty:1});
    });
  });

  // cart modal view (shop page)
  const cartBtn = document.querySelector('#open-cart');
  if(cartBtn){
    cartBtn.addEventListener('click', (e)=>{
      e.preventDefault();
      renderCartModal();
      document.querySelector('#cart-modal').classList.add('show');
    });
  }
  const cartClose = document.querySelector('#cart-close');
  if(cartClose) cartClose.addEventListener('click', ()=>document.querySelector('#cart-modal').classList.remove('show'));

  function renderCartModal(){
    const container = document.querySelector('#cart-items');
    if(!container) return;
    const cart = getCart();
    container.innerHTML = cart.length ? cart.map(item=>`
      <div class="row" style="justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.02)">
        <div>
          <div style="font-weight:800">${item.title}</div>
          <div style="font-size:13px;color:var(--muted)">${item.qty} × Rs/-${item.price}</div>
        </div>
        <div>
          <button class="btn" data-id="${item.id}" data-action="minus">−</button>
          <button class="btn" data-id="${item.id}" data-action="plus">+</button>
          <button class="btn" data-id="${item.id}" data-action="remove">✕</button>
        </div>
      </div>
    `).join('') : `<div class="center" style="padding:28px;color:var(--muted)">Cart is empty — add something from shop</div>`;
    // action handlers
    container.querySelectorAll('button[data-action]').forEach(b=>{
      b.addEventListener('click', ()=>{
        const id = b.dataset.id, action=b.dataset.action;
        const cart = getCart();
        const idx = cart.findIndex(i=>i.id===id);
        if(idx<0) return;
        if(action==='plus') cart[idx].qty++;
        if(action==='minus'){ cart[idx].qty--; if(cart[idx].qty<=0) cart.splice(idx,1) }
        if(action==='remove') cart.splice(idx,1);
        saveCart(cart);
        renderCartModal();
      });
    });
  }

  updateCartBadge();

  // small toast
  const toast = document.createElement('div'); toast.style.position='fixed'; toast.style.right='22px'; toast.style.bottom='22px'; toast.style.padding='12px 16px'; toast.style.borderRadius='10px'; toast.style.background='linear-gradient(90deg,rgba(0,240,255,0.06),rgba(255,46,196,0.06))'; toast.style.color='white'; toast.style.fontWeight='700'; toast.style.opacity='0'; toast.style.transition='opacity .2s'; toast.style.zIndex='9999'; document.body.appendChild(toast);
  let toastTimer = null;
  function showToast(txt){
    toast.textContent = txt;
    toast.style.opacity = 1;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(()=>toast.style.opacity=0, 2200);
  }

  // contact form simple validation
  const form = document.querySelector('#contact-form');
  if(form){
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const name = form.querySelector('[name=name]').value.trim();
      const email = form.querySelector('[name=email]').value.trim();
      const msg = form.querySelector('[name=message]').value.trim();
      if(!name || !email || !msg){ showToast('Please fill all fields'); return; }
      // simulate send
      showToast('Message sent — we will ping you soon!');
      form.reset();
    });
  }

  // small entrance animation for hero items
  document.querySelectorAll('.hero-left, .floating-phone, .card').forEach((el,i)=>{
    el.style.opacity=0;
    setTimeout(()=>{ el.style.transition='transform .8s var(--ease), opacity .6s var(--ease)'; el.style.opacity=1; el.style.transform='translateY(0)'} , 180+i*90)
  });

});
