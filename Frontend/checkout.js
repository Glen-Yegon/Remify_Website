document.addEventListener("DOMContentLoaded",()=>{

  /* =========================================================
     API CONFIGURATION
     ========================================================= */

const API_BASE_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000"
    : "https://remify-website.onrender.com";


  /* =========================================================
     PRODUCT / CHECKOUT STATE
     ========================================================= */

  const params=new URLSearchParams(
    window.location.search
  );

  const productId=params.get("id");

  let quantity=Math.max(
    1,
    Math.min(
      20,
      parseInt(
        params.get("qty")||"1",
        10
      )||1
    )
  );

  let currentProduct=null;


  /* =========================================================
     HELPERS
     ========================================================= */

  const $=id=>document.getElementById(id);


  const formatPrice=(amount,currency="KES")=>{

    if(
      amount===null||
      amount===undefined||
      amount===""
    ){
      return "";
    }

    try{

      return new Intl.NumberFormat(
        "en-KE",
        {
          style:"currency",
          currency,
          maximumFractionDigits:0
        }
      ).format(amount);

    }catch{

      return `${currency} ${amount}`;

    }

  };


  const getProductImage=product=>{

    const media=product?.media;

    if(typeof media==="string"){
      return media;
    }

    if(
      media&&
      typeof media==="object"&&
      typeof media.image==="string"
    ){
      return media.image;
    }

    if(
      media&&
      typeof media==="object"&&
      Array.isArray(media.images)&&
      media.images.length
    ){
      return media.images[0];
    }

    if(
      Array.isArray(media)&&
      media.length
    ){
      return media[0];
    }

    return "";

  };


  const escapeHTML=value=>{

    return String(value??"")
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;")
      .replace(/'/g,"&#039;");

  };


  const getProductSize=product=>{

    return (
      product?.details?.size||
      product?.size||
      product?.volume||
      product?.details?.volume||
      ""
    );

  };


  const updateURL=()=>{

    if(!currentProduct)return;

    const url=new URL(
      window.location.href
    );

    url.searchParams.set(
      "id",
      currentProduct.id
    );

    url.searchParams.set(
      "qty",
      quantity
    );

    window.history.replaceState(
      {},
      "",
      url
    );

  };


  /* =========================================================
     RENDER CHECKOUT SUMMARY
     ========================================================= */

  const renderSummary=()=>{

    if(!currentProduct)return;

    const pricing=
      currentProduct.pricing||{};

    const amount=
      Number(pricing.amount)||0;

    const currency=
      pricing.currency||"KES";

    const total=
      amount*quantity;

    const displayPrice=
      formatPrice(
        amount,
        currency
      );

    const displayTotal=
      formatPrice(
        total,
        currency
      );

    const image=
      getProductImage(
        currentProduct
      );

    const size=
      getProductSize(
        currentProduct
      );


    $("summaryProductImage").src=image;

    $("summaryProductImage").alt=
      currentProduct.name||
      "Remify product";


    $("summaryProductName").textContent=
      currentProduct.name||
      "Remify Product";


    $("summaryProductPrice").textContent=
      displayPrice;


    $("summaryProductSize").textContent=
      size;


    $("summaryQuantity").textContent=
      quantity;


    $("summarySubtotal").textContent=
      displayTotal;


    $("summaryTotal").textContent=
      displayTotal;


    $("summaryItemCount").textContent=
      `${quantity} ${
        quantity===1
          ?"item"
          :"items"
      }`;


    document.title=
      `Checkout — ${
        currentProduct.name||
        "Remify"
      }`;

  };


  /* =========================================================
     ERROR STATE
     ========================================================= */

  const showError=message=>{

    $("checkoutPage").innerHTML=`

      <div class="checkout-error-state">

        <div>

          <span class="checkout-eyebrow">
            REMIFY
          </span>

          <h1>
            We couldn't load your order.
          </h1>

          <p>
            ${escapeHTML(message)}
          </p>

          <a href="index.html">
            Back to Remify
          </a>

        </div>

      </div>

    `;

  };


  /* =========================================================
     LOAD PRODUCT
     ========================================================= */

  const loadProduct=async()=>{

    if(!productId){

      showError(
        "No product was specified."
      );

      return;

    }


    try{

      const response=await fetch(
        "data/products.json",
        {
          cache:"no-store"
        }
      );


      if(!response.ok){

        throw new Error(
          `Products request failed: ${response.status}`
        );

      }


      const data=
        await response.json();


      const products=
        Array.isArray(data)
          ?data
          :data.products;


      if(!Array.isArray(products)){

        throw new Error(
          "Products data is not available."
        );

      }


      currentProduct=
        products.find(
          product=>
            String(product.id)
              .toLowerCase()===
            String(productId)
              .toLowerCase()
        );


      if(!currentProduct){

        showError(
          "That product could not be found."
        );

        return;

      }


      renderSummary();


    }catch(error){

      console.error(
        "Remify checkout error:",
        error
      );


      showError(
        "Something went wrong while loading this product."
      );

    }

  };


  /* =========================================================
     QUANTITY
     ========================================================= */

  const changeQuantity=change=>{

    if(!currentProduct)return;


    quantity=Math.max(
      1,
      Math.min(
        20,
        quantity+change
      )
    );


    updateURL();

    renderSummary();

  };


  $("summaryQuantityMinus")?.addEventListener(
    "click",
    ()=>changeQuantity(-1)
  );


  $("summaryQuantityPlus")?.addEventListener(
    "click",
    ()=>changeQuantity(1)
  );


  /* =========================================================
     FORM
     ========================================================= */

  const form=
    $("checkoutForm");


  /* =========================================================
     FIELD VALIDATION
     ========================================================= */

  const validateField=field=>{

    const value=
      field.value.trim();


    const error=
      field.parentElement
        ?.querySelector(
          ".field-error"
        );


    field.parentElement
      ?.classList.remove(
        "has-error"
      );


    if(error){
      error.textContent="";
    }


    /* REQUIRED */

    if(
      field.required&&
      !value
    ){

      if(error){

        error.textContent=
          "This field is required.";

      }


      field.parentElement
        ?.classList.add(
          "has-error"
        );


      return false;

    }


    /* EMAIL */

    if(
      field.type==="email"&&
      value
    ){

      const valid=
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          .test(value);


      if(!valid){

        if(error){

          error.textContent=
            "Enter a valid email address.";

        }


        field.parentElement
          ?.classList.add(
            "has-error"
          );


        return false;

      }

    }


    /* PHONE */

    if(
      field.id==="phone"&&
      value
    ){

      const digits=
        value.replace(
          /\D/g,
          ""
        );


      if(digits.length<9){

        if(error){

          error.textContent=
            "Enter a valid phone number.";

        }


        field.parentElement
          ?.classList.add(
            "has-error"
          );


        return false;

      }

    }


    return true;

  };


  form?.querySelectorAll(
    "input"
  ).forEach(input=>{

    input.addEventListener(
      "blur",
      ()=>validateField(input)
    );


    input.addEventListener(
      "input",
      ()=>{

        if(
          input.parentElement
            .classList.contains(
              "has-error"
            )
        ){

          validateField(input);

        }

      }
    );

  });


  /* =========================================================
     PAYMENT FORM SUBMISSION
     ========================================================= */

  form?.addEventListener(
    "submit",
    async event=>{

      event.preventDefault();


      if(!currentProduct)return;


      /* =====================================
         VALIDATE FORM
         ===================================== */

      const fields=[
        ...form.querySelectorAll(
          "input[required]"
        )
      ];


      const valid=
        fields.every(
          validateField
        );


      if(!valid){

        const firstInvalid=
          form.querySelector(
            ".has-error input"
          );


        firstInvalid?.focus();

        return;

      }


      /* =====================================
         FORM DATA
         ===================================== */

      const formData=
        new FormData(form);


      /* =====================================
         BUILD ORDER
         ===================================== */

      const order={

        productId:
          currentProduct.id,

        quantity,


        customer:{

          fullName:
            String(
              formData.get(
                "fullName"
              )||""
            ).trim(),

          email:
            String(
              formData.get(
                "email"
              )||""
            ).trim(),

          phone:
            String(
              formData.get(
                "phone"
              )||""
            ).trim()

        },


        delivery:{

          country:
            String(
              formData.get(
                "country"
              )||""
            ).trim(),

          city:
            String(
              formData.get(
                "city"
              )||""
            ).trim(),

          address:
            String(
              formData.get(
                "address"
              )||""
            ).trim(),

          apartment:
            String(
              formData.get(
                "apartment"
              )||""
            ).trim()

        },


        affiliateCode:
          localStorage.getItem(
            "remifyAffiliateCode"
          )||null

      };


      /* =====================================
         BUTTON
         ===================================== */

      const button=
        $("paymentButton");


      const buttonText=
        button?.querySelector(
          "span"
        );


      const setProcessing=text=>{

        button?.classList.add(
          "is-processing"
        );


        if(buttonText){

          buttonText.textContent=
            text;

        }


        if(button){

          button.disabled=true;

        }

      };


      const resetButton=()=>{

        button?.classList.remove(
          "is-processing"
        );


        if(buttonText){

          buttonText.textContent=
            "Continue to payment";

        }


        if(button){

          button.disabled=false;

        }

      };


      /* =====================================
         PAYMENT INITIALIZATION
         ===================================== */

      try{

        setProcessing(
          "Preparing secure payment..."
        );


        const response=
          await fetch(
            `${API_BASE_URL}/api/payment/initialize`,
            {
              method:"POST",

              headers:{
                "Content-Type":
                  "application/json"
              },

              body:
                JSON.stringify(order)
            }
          );


        const data=
          await response.json();


        if(
          !response.ok||
          !data.success
        ){

          throw new Error(
            data.message||
            "We couldn't prepare your payment."
          );

        }


        /* ===================================
           SAVE ORDER BEFORE REDIRECT
           =================================== */

        sessionStorage.setItem(
          "remifyPendingOrder",
          JSON.stringify(order)
        );


        /* ===================================
           SAVE PAYMENT REFERENCE
           =================================== */

        if(data.reference){

          sessionStorage.setItem(
            "remifyPaymentReference",
            data.reference
          );

        }


        /* ===================================
           OPEN PAYSTACK
           =================================== */

        setProcessing(
          "Opening secure payment..."
        );


        if(!data.authorizationUrl){

          throw new Error(
            "We couldn't open the secure payment page. Please try again."
          );

        }


        /*
         * Paystack should be opened by redirect,
         * NOT inside an iframe/popup.
         */

        window.location.href=
          data.authorizationUrl;


      }catch(error){

        console.error(
          "Remify payment error:",
          error
        );


        resetButton();


        showCheckoutPaymentError(
          error.message||
          "We couldn't start your payment. Please try again."
        );

      }

    }
  );


  /* =========================================================
     CHECKOUT STATUS ELEMENTS
     ========================================================= */

  const checkoutStatus=
    $("checkoutStatus");

  const checkoutStatusIcon=
    $("checkoutStatusIcon");

  const checkoutStatusTitle=
    $("checkoutStatusTitle");

  const checkoutStatusMessage=
    $("checkoutStatusMessage");

  const checkoutStatusReference=
    $("checkoutStatusReference");

  const checkoutStatusAction=
    $("checkoutStatusAction");

  const checkoutStatusClose=
    $("checkoutStatusClose");


  /* =========================================================
     CHECKOUT STATUS
     ========================================================= */

  const showCheckoutStatus=({
    icon="✦",
    title="Processing your order",
    message="Please wait.",
    reference="",
    actionText="Continue",
    showAction=false
  }={})=>{

    if(!checkoutStatus)return;


    checkoutStatusIcon.textContent=
      icon;


    checkoutStatusTitle.textContent=
      title;


    checkoutStatusMessage.textContent=
      message;


    checkoutStatusReference.textContent=
      reference
        ?`Order reference: ${reference}`
        :"";


    checkoutStatusAction.textContent=
      actionText;


    checkoutStatusAction.style.display=
      showAction
        ?"inline-flex"
        :"none";


    checkoutStatus.classList.add(
      "is-visible"
    );


    checkoutStatus.setAttribute(
      "aria-hidden",
      "false"
    );


    document.body.classList.add(
      "checkout-status-open"
    );

  };


  const hideCheckoutStatus=()=>{

    checkoutStatus?.classList.remove(
      "is-visible"
    );


    checkoutStatus?.setAttribute(
      "aria-hidden",
      "true"
    );


    document.body.classList.remove(
      "checkout-status-open"
    );

  };


  const showCheckoutSuccess=
    reference=>{

      showCheckoutStatus({

        icon:"✓",

        title:
          "Your order is confirmed.",

        message:
          "Payment has been verified and your order details have been received. We've also sent a confirmation to your email.",

        reference,

        actionText:
          "Done",

        showAction:true

      });

    };


  const showCheckoutPaymentError=
    message=>{

      showCheckoutStatus({

        icon:"!",

        title:
          "Payment needs your attention.",

        message,

        actionText:
          "Try again",

        showAction:true

      });

    };


  checkoutStatusClose?.addEventListener(
    "click",
    hideCheckoutStatus
  );


  checkoutStatusAction?.addEventListener(
    "click",
    ()=>{

      hideCheckoutStatus();

    }
  );


  /* =========================================================
     MENU
     ========================================================= */

  const menu=
    $("checkoutMenu");

  const menuToggle=
    $("checkoutMenuToggle");

  const menuClose=
    $("checkoutMenuClose");


  const openMenu=()=>{

    menu?.classList.add(
      "is-open"
    );

    menu?.setAttribute(
      "aria-hidden",
      "false"
    );

    menuToggle?.setAttribute(
      "aria-expanded",
      "true"
    );

    document.body.classList.add(
      "menu-open"
    );

  };


  const closeMenu=()=>{

    menu?.classList.remove(
      "is-open"
    );

    menu?.setAttribute(
      "aria-hidden",
      "true"
    );

    menuToggle?.setAttribute(
      "aria-expanded",
      "false"
    );

    document.body.classList.remove(
      "menu-open"
    );

  };


  menuToggle?.addEventListener(
    "click",
    openMenu
  );


  menuClose?.addEventListener(
    "click",
    closeMenu
  );


  menu?.querySelectorAll(
    "a"
  ).forEach(link=>{

    link.addEventListener(
      "click",
      closeMenu
    );

  });


  document.addEventListener(
    "keydown",
    event=>{

      if(event.key==="Escape"){

        closeMenu();

      }

    }
  );


  menu?.addEventListener(
    "click",
    event=>{

      if(event.target===menu){

        closeMenu();

      }

    }
  );



  /* =========================================================
     INITIALIZE PRODUCT
     ========================================================= */

  loadProduct();




  /* =========================================================
     REMIFY SCROLL PROGRESS
     ========================================================= */

  const scrollFill=
    document.getElementById(
      "scrollFill"
    );


  const updateScrollProgress=()=>{

    if(!scrollFill)return;


    const scrollTop=
      window.scrollY||
      document.documentElement
        .scrollTop||
      0;


    const scrollHeight=
      document.documentElement
        .scrollHeight-
      window.innerHeight;


    const progress=
      scrollHeight>0
        ?Math.min(
            1,
            Math.max(
              0,
              scrollTop/scrollHeight
            )
          )
        :0;


    scrollFill.style.transform=
      `scaleY(${progress})`;

  };


  window.addEventListener(
    "scroll",
    updateScrollProgress,
    {
      passive:true
    }
  );


  window.addEventListener(
    "resize",
    updateScrollProgress
  );


  updateScrollProgress();


  /* =========================================================
     REMIFY CUSTOM CURSOR
     ========================================================= */

  const cursorCanvas=
    document.getElementById(
      "cursorTrail"
    );

  const cursorSpark=
    document.getElementById(
      "cursorSpark"
    );


  if(
    cursorCanvas&&
    cursorSpark
  ){

    const cursorContext=
      cursorCanvas.getContext(
        "2d"
      );


    let cursorWidth=
      window.innerWidth;

    let cursorHeight=
      window.innerHeight;


    let mouseX=
      cursorWidth/2;

    let mouseY=
      cursorHeight/2;


    let currentX=
      mouseX;

    let currentY=
      mouseY;


    const trail=[];

    const TRAIL_LENGTH=18;


    const resizeCursorCanvas=()=>{

      cursorWidth=
        window.innerWidth;

      cursorHeight=
        window.innerHeight;


      const dpr=
        Math.min(
          window.devicePixelRatio||1,
          2
        );


      cursorCanvas.width=
        cursorWidth*dpr;

      cursorCanvas.height=
        cursorHeight*dpr;


      cursorCanvas.style.width=
        `${cursorWidth}px`;

      cursorCanvas.style.height=
        `${cursorHeight}px`;


      cursorContext.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
      );

    };


    const moveCursor=event=>{

      mouseX=
        event.clientX;

      mouseY=
        event.clientY;


      cursorSpark.style.left=
        `${mouseX}px`;

      cursorSpark.style.top=
        `${mouseY}px`;


      trail.push({

        x:mouseX,

        y:mouseY

      });


      if(
        trail.length>
        TRAIL_LENGTH
      ){

        trail.shift();

      }

    };


    const drawCursorTrail=()=>{

      cursorContext.clearRect(
        0,
        0,
        cursorWidth,
        cursorHeight
      );


      currentX+=
        (mouseX-currentX)*
        .18;


      currentY+=
        (mouseY-currentY)*
        .18;


      if(trail.length>1){

        cursorContext.beginPath();


        trail.forEach(
          (point,index)=>{

            if(index===0){

              cursorContext.moveTo(
                point.x,
                point.y
              );

            }else{

              cursorContext.lineTo(
                point.x,
                point.y
              );

            }

          }
        );


        cursorContext.strokeStyle=
          "rgba(91,45,130,.18)";


        cursorContext.lineWidth=
          1.2;


        cursorContext.lineCap=
          "round";


        cursorContext.lineJoin=
          "round";


        cursorContext.stroke();

      }


      requestAnimationFrame(
        drawCursorTrail
      );

    };


    resizeCursorCanvas();

    drawCursorTrail();


    window.addEventListener(
      "resize",
      resizeCursorCanvas
    );


    window.addEventListener(
      "mousemove",
      moveCursor,
      {
        passive:true
      }
    );


    const interactiveElements=
      document.querySelectorAll(
        "a,button,input,select,textarea,[role='button']"
      );


    interactiveElements.forEach(
      element=>{

        element.addEventListener(
          "mouseenter",
          ()=>{

            cursorSpark.classList.add(
              "cursor-spark--active"
            );

          }
        );


        element.addEventListener(
          "mouseleave",
          ()=>{

            cursorSpark.classList.remove(
              "cursor-spark--active"
            );

          }
        );

      }
    );


    window.addEventListener(
      "mousedown",
      ()=>{

        cursorSpark.classList.add(
          "cursor-spark--click"
        );

      }
    );


    window.addEventListener(
      "mouseup",
      ()=>{

        cursorSpark.classList.remove(
          "cursor-spark--click"
        );

      }
    );

  }

});