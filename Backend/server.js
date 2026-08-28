require("dotenv").config();

const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();
const bcrypt=require("bcryptjs");
const jwt=require("jsonwebtoken");
const products = require("./products");
const express=require("express");
const nodemailer=require("nodemailer");
const cors=require("cors");
const app=express();
const PORT=process.env.PORT||5000;

/* =========================================================
   01. CONFIGURATION
   ========================================================= */

const PAYSTACK_BASE_URL="https://api.paystack.co";

const OWNER_EMAIL=process.env.OWNER_EMAIL;
const FRONTEND_URL=process.env.FRONTEND_URL;

if(!process.env.PAYSTACK_SECRET_KEY){
  console.error("Missing PAYSTACK_SECRET_KEY in .env");
  process.exit(1);
}

if(!process.env.SMTP_USER||!process.env.SMTP_PASS){
  console.error("Missing SMTP credentials in .env");
  process.exit(1);
}


/* =========================================================
   02. EXPRESS
   ========================================================= */

app.use(express.json({
  limit:"100kb"
}));

app.use(express.urlencoded({
  extended:true,
  limit:"100kb"
}));

app.use(cors({
  origin: [
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "https://remify.co",
    "https://www.remify.co",
    "https://remify-website.vercel.app"
  ]
}));

/* =========================================================
   03. SMTP
   ========================================================= */

const mailer=nodemailer.createTransport({
  host:process.env.SMTP_HOST,
  port:Number(process.env.SMTP_PORT)||465,
  secure:String(process.env.SMTP_SECURE).toLowerCase()==="true",
  auth:{
    user:process.env.SMTP_USER,
    pass:process.env.SMTP_PASS
  },
tls: {
  rejectUnauthorized: false
}
});


/* =========================================================
   04. SMTP CONNECTION TEST
   ========================================================= */

const verifyMailer=async()=>{
  try{
    await mailer.verify();
    console.log("SMTP connection verified.");
  }catch(error){
    console.error("SMTP connection failed:",error.message);
  }
};


/* =========================================================
   05. HELPERS
   ========================================================= */
const generateReferralCode = async () => {

  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  for (let attempt = 0; attempt < 10; attempt++) {

    let code = "";

    for (let i = 0; i < 6; i++) {
      code += characters[
        Math.floor(Math.random() * characters.length)
      ];
    }

    const referralCode = `RMF${code}`;

    const existing = await db
      .collection("affiliates")
      .where("referralCode", "==", referralCode)
      .limit(1)
      .get();

    if (existing.empty) {
      return referralCode;
    }
  }

  throw new Error(
    "Unable to generate a unique affiliate referral code."
  );
};

const escapeHTML=value=>{
  return String(value??"")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");
};


const formatPrice=(amount,currency="KES")=>{
  try{
    return new Intl.NumberFormat("en-KE",{
      style:"currency",
      currency,
      maximumFractionDigits:0
    }).format(amount);
  }catch{
    return `${currency} ${amount}`;
  }
};


const generateReference=()=>{
  const timestamp=Date.now().toString(36).toUpperCase();
  const random=Math.random()
    .toString(36)
    .substring(2,8)
    .toUpperCase();

  return `RMF-${timestamp}-${random}`;
};

const paystackRequest = async (endpoint, options = {}) => {

  const response = await fetch(
    `${PAYSTACK_BASE_URL}${endpoint}`,
    {
      ...options,
      headers: {
        "Authorization":
          `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type":
          "application/json",
        ...(options.headers || {})
      }
    }
  );

  // Read the raw response first
  const rawResponse = await response.text();

  console.log("=================================");
  console.log("PAYSTACK STATUS:", response.status);
  console.log("PAYSTACK RESPONSE:", rawResponse);
  console.log("=================================");

  let data;

  try {
    data = JSON.parse(rawResponse);
  } catch {
    throw new Error(
      `Paystack returned an invalid response. HTTP ${response.status}`
    );
  }

  /* =========================================
     PAYSTACK ERROR
     ========================================= */

  if (!response.ok || data.status !== true) {

    console.error(
      "Paystack API error:",
      data
    );

    throw new Error(
      data.message ||
      "Paystack request failed."
    );

  }

  return data;
};

/* =========================================================
   07. AFFILIATE REGISTRATION
   ========================================================= */

app.post("/api/affiliate/register",async(req,res)=>{

  try{

    const {
      fullName,
      email,
      phone,
      password
    }=req.body;


    /* =====================================================
       VALIDATION
       ===================================================== */

    if(!fullName?.trim()){
      return res.status(400).json({
        success:false,
        message:"Full name is required."
      });
    }

    if(!email?.trim()){
      return res.status(400).json({
        success:false,
        message:"Email address is required."
      });
    }

    if(!phone?.trim()){
      return res.status(400).json({
        success:false,
        message:"Phone number is required."
      });
    }

    if(!password){
      return res.status(400).json({
        success:false,
        message:"Password is required."
      });
    }

    if(password.length<8){
      return res.status(400).json({
        success:false,
        message:
          "Password must be at least 8 characters."
      });
    }


    /* =====================================================
       NORMALIZE EMAIL
       ===================================================== */

    const normalizedEmail=
      email.trim().toLowerCase();


    /* =====================================================
       CHECK EXISTING AFFILIATE
       ===================================================== */

    const existingSnapshot=
      await db
        .collection("affiliates")
        .where("email","==",normalizedEmail)
        .limit(1)
        .get();


    if(!existingSnapshot.empty){

      return res.status(409).json({
        success:false,
        message:
          "An affiliate account with this email already exists."
      });

    }


    /* =====================================================
       HASH PASSWORD
       ===================================================== */

    const passwordHash=
      await bcrypt.hash(password,12);

    const referralCode =
      await generateReferralCode();

    /* =====================================================
       CREATE AFFILIATE
       ===================================================== */

    const affiliateRef=
      db.collection("affiliates").doc();

    const affiliateId=
      affiliateRef.id;


    /* =====================================================
       SAVE AFFILIATE
       ===================================================== */

    await affiliateRef.set({

    affiliateId,

    referralCode,

    fullName:
        fullName.trim(),

    email:
        normalizedEmail,

      phone:
        phone.trim(),

      passwordHash,

      status:
        "pending",

      commissionRate:
        0.20,

      totalSales:
        0,

      totalSalesAmount:
        0,

      totalCommission:
        0,

      unpaidCommission:
        0,

      createdAt:
        new Date().toISOString(),

      approvedAt:
        null,

      lastPayoutAt:
        null

    });


    /* =====================================================
       RESPONSE
       ===================================================== */

    return res.status(201).json({

      success:true,

      message:
        "Affiliate application submitted successfully.",

    affiliate:{
    affiliateId,
    referralCode,
    fullName:fullName.trim(),
    email:normalizedEmail,
    status:"pending"
    }

    });

  }catch(error){

    console.error(
      "Affiliate registration error:",
      error
    );

    return res.status(500).json({

      success:false,

      message:
        "We couldn't create your affiliate account. Please try again."

    });

  }

});

/* =========================================================
   08. AFFILIATE LOGIN
   ========================================================= */

app.post("/api/affiliate/login",async(req,res)=>{

  try{

    const {
      email,
      password
    }=req.body;


    /* =====================================================
       VALIDATION
       ===================================================== */

    if(!email?.trim()){
      return res.status(400).json({
        success:false,
        message:"Email address is required."
      });
    }

    if(!password){
      return res.status(400).json({
        success:false,
        message:"Password is required."
      });
    }


    /* =====================================================
       NORMALIZE EMAIL
       ===================================================== */

    const normalizedEmail=
      email.trim().toLowerCase();


    /* =====================================================
       FIND AFFILIATE
       ===================================================== */

    const snapshot=
      await db
        .collection("affiliates")
        .where("email","==",normalizedEmail)
        .limit(1)
        .get();


    if(snapshot.empty){

      return res.status(401).json({
        success:false,
        message:"Invalid email or password."
      });

    }


    const affiliateDoc=
      snapshot.docs[0];

    const affiliate=
      affiliateDoc.data();


    /* =====================================================
       VERIFY PASSWORD
       ===================================================== */

    const passwordValid=
      await bcrypt.compare(
        password,
        affiliate.passwordHash
      );


    if(!passwordValid){

      return res.status(401).json({
        success:false,
        message:"Invalid email or password."
      });

    }


    /* =====================================================
       CHECK ACCOUNT STATUS
       ===================================================== */

    if(affiliate.status==="pending"){

      return res.status(403).json({
        success:false,
        status:"pending",
        message:
          "Your affiliate application is still awaiting approval."
      });

    }


    if(affiliate.status!=="approved"){

      return res.status(403).json({
        success:false,
        status:affiliate.status,
        message:
          "Your affiliate account is not currently active."
      });

    }


    /* =====================================================
       CREATE JWT
       ===================================================== */

    if(!process.env.JWT_SECRET){

      console.error(
        "Missing JWT_SECRET in .env"
      );

      return res.status(500).json({
        success:false,
        message:
          "Authentication service is not configured."
      });

    }


    const token=
      jwt.sign(
        {
          affiliateId:
            affiliate.affiliateId,

          email:
            affiliate.email,

          role:
            "affiliate"
        },

        process.env.JWT_SECRET,

        {
          expiresIn:"7d"
        }
      );


    /* =====================================================
       RESPONSE
       ===================================================== */

    return res.json({

      success:true,

      message:
        "Login successful.",

      token,

      affiliate:{
        affiliateId:
          affiliate.affiliateId,

        fullName:
          affiliate.fullName,

        email:
          affiliate.email,

        phone:
          affiliate.phone,

        status:
          affiliate.status
      }

    });

  }catch(error){

    console.error(
      "Affiliate login error:",
      error
    );

    return res.status(500).json({

      success:false,

      message:
        "We couldn't log you in. Please try again."

    });

  }

});


/* =========================================================
   09. AFFILIATE AUTHENTICATION MIDDLEWARE
   ========================================================= */

const authenticateAffiliate=(req,res,next)=>{

  try{

    const authorization=
      req.headers.authorization||"";

    if(!authorization.startsWith("Bearer ")){

      return res.status(401).json({
        success:false,
        message:"Authentication required."
      });

    }


    const token=
      authorization.substring(7).trim();


    if(!token){

      return res.status(401).json({
        success:false,
        message:"Authentication token is missing."
      });

    }


    if(!process.env.JWT_SECRET){

      console.error(
        "Missing JWT_SECRET in .env"
      );

      return res.status(500).json({
        success:false,
        message:
          "Authentication service is not configured."
      });

    }


    const decoded=
      jwt.verify(
        token,
        process.env.JWT_SECRET
      );


    if(
      !decoded.affiliateId||
      decoded.role!=="affiliate"
    ){

      return res.status(401).json({
        success:false,
        message:"Invalid authentication token."
      });

    }


    req.affiliate={
      affiliateId:
        decoded.affiliateId,

      email:
        decoded.email,

      role:
        decoded.role

    };


    next();

  }catch(error){

    console.error(
      "Affiliate authentication error:",
      error.message
    );

    return res.status(401).json({
      success:false,
      message:
        "Your session is invalid or has expired. Please log in again."
    });

  }

};


/* =========================================================
   10. AFFILIATE AUTHENTICATION TEST
   ========================================================= */

app.get(
  "/api/affiliate/protected-test",
  authenticateAffiliate,
  async(req,res)=>{

    return res.json({

      success:true,

      message:
        "Affiliate authentication is working.",

      affiliateId:
        req.affiliate.affiliateId,

      email:
        req.affiliate.email

    });

  }
);

/* =========================================================
   OWNER AUTHENTICATION
   ========================================================= */

const authenticateOwner = (req, res, next) => {

  try {

    const authorization =
      req.headers.authorization || "";

    if (!authorization.startsWith("Bearer ")) {

      return res.status(401).json({
        success: false,
        message: "Owner authentication required."
      });

    }

    const token =
      authorization.substring(7).trim();

    if (!token) {

      return res.status(401).json({
        success: false,
        message: "Owner authentication token is missing."
      });

    }

    if (!process.env.OWNER_JWT_SECRET) {

      console.error(
        "Missing OWNER_JWT_SECRET in .env"
      );

      return res.status(500).json({
        success: false,
        message:
          "Owner authentication is not configured."
      });

    }

    const decoded =
      jwt.verify(
        token,
        process.env.OWNER_JWT_SECRET
      );

    if (
      !decoded.ownerId ||
      decoded.role !== "owner"
    ) {

      return res.status(401).json({
        success: false,
        message: "Invalid owner authentication token."
      });

    }

    req.owner = {
      ownerId: decoded.ownerId,
      username: decoded.username,
      role: decoded.role
    };

    next();

  } catch (error) {

    console.error(
      "Owner authentication error:",
      error.message
    );

    return res.status(401).json({
      success: false,
      message:
        "Your owner session is invalid or has expired."
    });

  }

};

/* =========================================================
   OWNER LOGIN
   ========================================================= */

app.post("/api/owner/login", async (req, res) => {

  try {

    const {
      username,
      password
    } = req.body;


    /* =========================================
       VALIDATION
       ========================================= */

    if (!username?.trim()) {

      return res.status(400).json({
        success: false,
        message: "Username is required."
      });

    }

    if (!password) {

      return res.status(400).json({
        success: false,
        message: "Password is required."
      });

    }


    /* =========================================
       CHECK CONFIGURATION
       ========================================= */

    if (
      !process.env.OWNER_USERNAME ||
      !process.env.OWNER_PASSWORD ||
      !process.env.OWNER_JWT_SECRET
    ) {

      console.error(
        "Owner authentication environment variables are missing."
      );

      return res.status(500).json({
        success: false,
        message:
          "Owner authentication is not configured."
      });

    }


    /* =========================================
       VERIFY CREDENTIALS
       ========================================= */

    const usernameValid =
      username.trim() ===
      process.env.OWNER_USERNAME;

    const passwordValid =
      password ===
      process.env.OWNER_PASSWORD;


    if (
      !usernameValid ||
      !passwordValid
    ) {

      return res.status(401).json({
        success: false,
        message:
          "Invalid owner credentials."
      });

    }


    /* =========================================
       CREATE OWNER TOKEN
       ========================================= */

    const token =
      jwt.sign(
        {
          ownerId: "remify-owner",

          username:
            process.env.OWNER_USERNAME,

          role: "owner"
        },

        process.env.OWNER_JWT_SECRET,

        {
          expiresIn: "12h"
        }
      );


    /* =========================================
       RESPONSE
       ========================================= */

    return res.json({

      success: true,

      message:
        "Owner login successful.",

      token

    });

  } catch (error) {

    console.error(
      "Owner login error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "We couldn't log you in."
    });

  }

});

/* =========================================================
   OWNER AUTHENTICATION TEST
   ========================================================= */

app.get(
  "/api/owner/protected-test",
  authenticateOwner,
  async (req, res) => {

    return res.json({

      success: true,

      message:
        "Owner authentication is working.",

      ownerId:
        req.owner.ownerId,

      username:
        req.owner.username

    });

  }
);

/* =========================================================
   OWNER — PENDING AFFILIATES
   ========================================================= */

app.get(
  "/api/owner/affiliates/pending",
  authenticateOwner,
  async (req, res) => {

    try {

      const snapshot =
        await db
          .collection("affiliates")
          .where("status", "==", "pending")
          .get();


      const affiliates =
        snapshot.docs.map(doc => {

          const affiliate =
            doc.data();

          return {

            affiliateId:
              doc.id,

            fullName:
              affiliate.fullName || "",

            email:
              affiliate.email || "",

            phone:
              affiliate.phone || "",

            status:
              affiliate.status || "pending",

            commissionRate:
              affiliate.commissionRate ?? 0.20,

            createdAt:
              affiliate.createdAt || null

          };

        });


      /* =========================================
         SORT — OLDEST APPLICATION FIRST
         ========================================= */

      affiliates.sort((a, b) => {

        return new Date(a.createdAt || 0) -
               new Date(b.createdAt || 0);

      });


      return res.json({

        success: true,

        count:
          affiliates.length,

        affiliates

      });

    } catch (error) {

      console.error(
        "Pending affiliates error:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "We couldn't load pending affiliate applications."

      });

    }

  }
);

/* =========================================================
   OWNER — APPROVE AFFILIATE
   ========================================================= */

app.post(
  "/api/owner/affiliates/:affiliateId/approve",
  authenticateOwner,
  async (req, res) => {

    try {

      const affiliateId =
        String(req.params.affiliateId || "").trim();


      /* =========================================
         VALIDATION
         ========================================= */

      if (!affiliateId) {

        return res.status(400).json({

          success: false,

          message:
            "Affiliate ID is required."

        });

      }


      /* =========================================
         GET AFFILIATE
         ========================================= */

      const affiliateRef =
        db
          .collection("affiliates")
          .doc(affiliateId);

      const affiliateSnapshot =
        await affiliateRef.get();


      if (!affiliateSnapshot.exists) {

        return res.status(404).json({

          success: false,

          message:
            "Affiliate account could not be found."

        });

      }


      const affiliate =
        affiliateSnapshot.data();


      /* =========================================
         CHECK CURRENT STATUS
         ========================================= */

      if (affiliate.status === "approved") {

        return res.status(409).json({

          success: false,

          message:
            "This affiliate has already been approved."

        });

      }


      if (affiliate.status !== "pending") {

        return res.status(409).json({

          success: false,

          message:
            "This affiliate application cannot be approved."

        });

      }


      /* =========================================
         APPROVAL TIMESTAMP
         ========================================= */

      const approvedAt =
        new Date().toISOString();


      /* =========================================
         UPDATE AFFILIATE
         ========================================= */

      await affiliateRef.update({

        status:
          "approved",

        approvedAt

      });


      /* =========================================
         SEND APPROVAL EMAIL
         ========================================= */

      try {

        await sendAffiliateApprovalEmail({

          fullName:
            affiliate.fullName,

          email:
            affiliate.email,

          referralCode:
            affiliate.referralCode || null,

          commissionRate:
            affiliate.commissionRate ?? 0.20

        });

      } catch (emailError) {

        console.error(
          "Affiliate approval email error:",
          emailError
        );

        /*
         * The affiliate has already been approved.
         * We do not undo the approval simply because
         * an email failed.
         *
         * The owner still receives a successful approval
         * response, while the email error is logged.
         */

      }


      /* =========================================
         RESPONSE
         ========================================= */

      return res.json({

        success: true,

        message:
          "Affiliate approved successfully.",

        affiliate: {

          affiliateId,

          fullName:
            affiliate.fullName,

          email:
            affiliate.email,

          status:
            "approved",

          approvedAt

        }

      });

    } catch (error) {

      console.error(
        "Approve affiliate error:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "We couldn't approve this affiliate."

      });

    }

  }
);
/* =========================================================
   OWNER — REMOVE AFFILIATE
   ========================================================= */

app.post(
  "/api/owner/affiliates/:affiliateId/reject",
  authenticateOwner,
  async (req, res) => {

    try {

      const affiliateId =
        String(req.params.affiliateId || "").trim();


      /* =========================================
         VALIDATION
         ========================================= */

      if (!affiliateId) {

        return res.status(400).json({

          success: false,

          message:
            "Affiliate ID is required."

        });

      }


      /* =========================================
         GET AFFILIATE
         ========================================= */

      const affiliateRef =
        db
          .collection("affiliates")
          .doc(affiliateId);

      const affiliateSnapshot =
        await affiliateRef.get();


      if (!affiliateSnapshot.exists) {

        return res.status(404).json({

          success: false,

          message:
            "Affiliate account could not be found."

        });

      }


      const affiliate =
        affiliateSnapshot.data();


      /* =========================================
         CHECK CURRENT STATUS
         ========================================= */

      if (affiliate.status === "rejected") {

        return res.status(409).json({

          success: false,

          message:
            "This affiliate has already been removed."

        });

      }


      /* =========================================
         CHECK UNPAID COMMISSION
         ========================================= */

      const unpaidCommission =
        Number(
          affiliate.unpaidCommission ||
          affiliate.pendingCommission ||
          affiliate.totalCommission ||
          0
        );


      if (unpaidCommission > 0) {

        return res.status(409).json({

          success: false,

          code:
            "UNPAID_COMMISSION",

          message:
            `This affiliate has ${formatCurrency(
              unpaidCommission
            )} in unpaid commission. Please pay the outstanding commission before removing this affiliate.`,

          unpaidCommission

        });

      }


      /* =========================================
         REMOVE AFFILIATE
         ========================================= */

      const removedAt =
        new Date().toISOString();


      await affiliateRef.update({

        status:
          "rejected",

        rejectedAt:
          removedAt,

        removedAt

      });


      /* =========================================
         RESPONSE
         ========================================= */

      return res.json({

        success: true,

        message:
          "Affiliate removed successfully.",

        affiliate: {

          affiliateId,

          fullName:
            affiliate.fullName,

          email:
            affiliate.email,

          status:
            "rejected",

          removedAt

        }

      });

    } catch (error) {

      console.error(
        "Remove affiliate error:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "We couldn't remove this affiliate."

      });

    }

  }
);

/* =========================================================
   15I. OWNER DASHBOARD
   ========================================================= */

app.get(
  "/api/owner/dashboard",
  authenticateOwner,
  async (req, res) => {

    try {

      /* =========================================
         GET ALL AFFILIATES
         ========================================= */

      const snapshot =
        await db
          .collection("affiliates")
          .get();


      let totalAffiliates = 0;
      let pendingAffiliates = 0;
      let approvedAffiliates = 0;
      let rejectedAffiliates = 0;

      let totalSales = 0;
      let totalSalesAmount = 0;
      let totalCommission = 0;
      let unpaidCommission = 0;


      /* =========================================
         CALCULATE DASHBOARD TOTALS
         ========================================= */

      snapshot.forEach(doc => {

        const affiliate =
          doc.data();


        totalAffiliates++;


        /* =====================================
           STATUS
           ===================================== */

        if (affiliate.status === "pending") {

          pendingAffiliates++;

        } else if (affiliate.status === "approved") {

          approvedAffiliates++;

        } else if (affiliate.status === "rejected") {

          rejectedAffiliates++;

        }


        /* =====================================
           SALES
           ===================================== */

        totalSales +=
          Number(affiliate.totalSales || 0);


        totalSalesAmount +=
          Number(affiliate.totalSalesAmount || 0);


        /* =====================================
           COMMISSIONS
           ===================================== */

        totalCommission +=
          Number(affiliate.totalCommission || 0);


        unpaidCommission +=
          Number(affiliate.unpaidCommission || 0);

      });


      /* =========================================
         RESPONSE
         ========================================= */

      return res.json({

        success: true,

        dashboard: {

          affiliates: {

            total:
              totalAffiliates,

            pending:
              pendingAffiliates,

            approved:
              approvedAffiliates,

            rejected:
              rejectedAffiliates

          },

          sales: {

            total:
              totalSales,

            totalAmount:
              totalSalesAmount

          },

          commissions: {

            total:
              totalCommission,

            unpaid:
              unpaidCommission

          }

        }

      });

    } catch (error) {

      console.error(
        "Owner dashboard error:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "We couldn't load the owner dashboard."

      });

    }

  }
);

/* =========================================================
   15K. OWNER AFFILIATE LIST
   ========================================================= */

app.get(
  "/api/owner/affiliates",
  authenticateOwner,
  async (req, res) => {

    try {

      /* =========================================
         GET ALL AFFILIATES
         ========================================= */

      const snapshot =
        await db
          .collection("affiliates")
          .get();


      /* =========================================
         BUILD AFFILIATE LIST
         ========================================= */

      const affiliates =
        snapshot.docs.map(doc => {

          const affiliate =
            doc.data();


          return {

            affiliateId:
              affiliate.affiliateId ||
              doc.id,

            fullName:
              affiliate.fullName ||
              "",

            email:
              affiliate.email ||
              "",

            phone:
              affiliate.phone ||
              "",

            referralCode:
              affiliate.referralCode ||
              "",

            status:
              affiliate.status ||
              "pending",

            commissionRate:
              Number(
                affiliate.commissionRate || 0
              ),

            totalSales:
              Number(
                affiliate.totalSales || 0
              ),

            totalSalesAmount:
              Number(
                affiliate.totalSalesAmount || 0
              ),

            totalCommission:
              Number(
                affiliate.totalCommission || 0
              ),

            unpaidCommission:
              Number(
                affiliate.unpaidCommission || 0
              ),

            lastPayoutAt:
              affiliate.lastPayoutAt ||
              null,

            createdAt:
              affiliate.createdAt ||
              null

          };

        });


      /* =========================================
         RESPONSE
         ========================================= */

      return res.json({

        success: true,

        affiliates

      });


    } catch (error) {

      console.error(
        "Owner affiliates error:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Unable to load affiliate accounts."

      });

    }

  }
);


/* =========================================================
   15L-0. OWNER — AFFILIATE PAYMENTS SUMMARY
   ========================================================= */

app.get(
  "/api/owner/affiliates/payments",
  authenticateOwner,
  async (req, res) => {

    try {

      /* =========================================
         GET APPROVED AFFILIATES
         ========================================= */

      const affiliatesSnapshot =
        await db
          .collection("affiliates")
          .where("status", "==", "approved")
          .get();

      const affiliates = {};

      affiliatesSnapshot.docs.forEach(doc => {

        const affiliate = doc.data();

        affiliates[doc.id] = {

          affiliateId:
            affiliate.affiliateId || doc.id,

          fullName:
            affiliate.fullName || "",

          email:
            affiliate.email || "",

          phone:
            affiliate.phone || "",

          referralCode:
            affiliate.referralCode || "",

          commissionRate:
            Number(affiliate.commissionRate || 0),

          totalSalesAmount:
            Number(affiliate.totalSalesAmount || 0),

          totalCommission:
            Number(affiliate.totalCommission || 0),

          unpaidCommission:
            Number(affiliate.unpaidCommission || 0),

          lastPayoutAt:
            affiliate.lastPayoutAt || null,

          monthlySalesCount: 0,

          monthlySalesAmount: 0,

          monthlyCommissionAmount: 0

        };

      });


      /* =========================================
         CURRENT MONTH WINDOW
         ========================================= */

      const now = new Date();

      const monthStart =
        new Date(
          now.getFullYear(),
          now.getMonth(),
          1
        ).toISOString();


      /* =========================================
         THIS MONTH'S AFFILIATE ORDERS
         ========================================= */

      const ordersSnapshot =
        await db
          .collection("affiliate_orders")
          .where("createdAt", ">=", monthStart)
          .get();

      ordersSnapshot.docs.forEach(doc => {

        const order = doc.data();
        const affiliateId = order.affiliateId;

        if (affiliates[affiliateId]) {

          affiliates[affiliateId].monthlySalesCount += 1;

          affiliates[affiliateId].monthlySalesAmount +=
            Number(order.saleAmount || 0);

          affiliates[affiliateId].monthlyCommissionAmount +=
            Number(order.commissionAmount || 0);

        }

      });


      /* =========================================
         BUILD RESPONSE LIST
         ========================================= */

      const affiliatePayments =
        Object.values(affiliates).map(affiliate => ({

          ...affiliate,

          monthlySalesAmount:
            Number(affiliate.monthlySalesAmount.toFixed(2)),

          monthlyCommissionAmount:
            Number(affiliate.monthlyCommissionAmount.toFixed(2))

        }));


      /* =========================================
         SORT — HIGHEST UNPAID FIRST
         ========================================= */

      affiliatePayments.sort((a, b) => {
        return b.unpaidCommission - a.unpaidCommission;
      });


      /* =========================================
         RESPONSE
         ========================================= */

      return res.json({

        success: true,

        count:
          affiliatePayments.length,

        affiliates:
          affiliatePayments

      });

    } catch (error) {

      console.error(
        "Affiliate payments summary error:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "We couldn't load affiliate payment data."

      });

    }

  }
);


/* =========================================================
   15L. OWNER — AFFILIATE PAYOUT
   ========================================================= */

app.post(
  "/api/owner/affiliates/:affiliateId/payout",
  authenticateOwner,
  async (req, res) => {

    try {

      const affiliateId =
        String(req.params.affiliateId || "").trim();

      const {
        amount,
        method,
        reference,
        notes
      } = req.body;


      /* =========================================
         VALIDATION
         ========================================= */

      if (!affiliateId) {

        return res.status(400).json({

          success: false,

          message:
            "Affiliate ID is required."

        });

      }


      /* =========================================
         GET AFFILIATE
         ========================================= */

      const affiliateRef =
        db
          .collection("affiliates")
          .doc(affiliateId);


      const affiliateSnapshot =
        await affiliateRef.get();


      if (!affiliateSnapshot.exists) {

        return res.status(404).json({

          success: false,

          message:
            "Affiliate account could not be found."

        });

      }


      const affiliate =
        affiliateSnapshot.data();


      /* =========================================
         ACCOUNT STATUS
         ========================================= */

      if (affiliate.status !== "approved") {

        return res.status(409).json({

          success: false,

          message:
            "Only approved affiliates can receive payouts."

        });

      }


      /* =========================================
         CURRENT UNPAID COMMISSION
         ========================================= */

      const unpaidCommission =
        Number(
          affiliate.unpaidCommission || 0
        );


      if (
        !Number.isFinite(unpaidCommission) ||
        unpaidCommission <= 0
      ) {

        return res.status(409).json({

          success: false,

          message:
            "This affiliate has no unpaid commission available for payout."

        });

      }


      /* =========================================
         PAYOUT AMOUNT
         ========================================= */

      let payoutAmount;


      if (
        amount === undefined ||
        amount === null ||
        amount === ""
      ) {

        payoutAmount =
          unpaidCommission;

      } else {

        payoutAmount =
          Number(amount);

      }


      if (
        !Number.isFinite(payoutAmount) ||
        payoutAmount <= 0
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Payout amount must be greater than zero."

        });

      }


      /* =========================================
         ROUND MONEY
         ========================================= */

      payoutAmount =
        Number(
          payoutAmount.toFixed(2)
        );


      /* =========================================
         PREVENT OVERPAYMENT
         ========================================= */

      if (payoutAmount > unpaidCommission) {

        return res.status(400).json({

          success: false,

          message:
            "Payout amount cannot exceed the affiliate's unpaid commission."

        });

      }


      /* =========================================
         PAYMENT METHOD
         ========================================= */

      const payoutMethod =
        String(
          method || "external"
        )
        .trim()
        .toLowerCase();


      const allowedMethods = [
        "mpesa",
        "bank",
        "cash",
        "external",
        "other"
      ];


      if (
        !allowedMethods.includes(
          payoutMethod
        )
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Invalid payout method."

        });

      }


      /* =========================================
         PAYOUT REFERENCE
         ========================================= */

      const payoutReference =
        String(
          reference || ""
        ).trim();


      /* =========================================
         PAYOUT TIMESTAMP
         ========================================= */

      const paidAt =
        new Date().toISOString();


      /* =========================================
         PAYOUT ID
         ========================================= */

      const payoutRef =
        db
          .collection("affiliate_payouts")
          .doc();


      const payoutId =
        payoutRef.id;


      /* =========================================
         FIRESTORE TRANSACTION
         ========================================= */

      await db.runTransaction(
        async firestoreTransaction => {

          const currentAffiliateSnapshot =
            await firestoreTransaction.get(
              affiliateRef
            );


          if (
            !currentAffiliateSnapshot.exists
          ) {

            throw new Error(
              "AFFILIATE_NOT_FOUND"
            );

          }


          const currentAffiliate =
            currentAffiliateSnapshot.data();


          const currentUnpaidCommission =
            Number(
              currentAffiliate.unpaidCommission || 0
            );


          if (
            !Number.isFinite(
              currentUnpaidCommission
            ) ||
            currentUnpaidCommission <= 0
          ) {

            throw new Error(
              "NO_UNPAID_COMMISSION"
            );

          }


          if (
            payoutAmount >
            currentUnpaidCommission
          ) {

            throw new Error(
              "PAYOUT_EXCEEDS_BALANCE"
            );

          }


          const remainingUnpaidCommission =
            Number(
              (
                currentUnpaidCommission -
                payoutAmount
              ).toFixed(2)
            );


          firestoreTransaction.set(
            payoutRef,
            {

              payoutId,

              affiliateId,

              affiliateName:
                currentAffiliate.fullName ||
                "",

              affiliateEmail:
                currentAffiliate.email ||
                "",

              amount:
                payoutAmount,

              currency:
                "KES",

              method:
                payoutMethod,

              reference:
                payoutReference,

              notes:
                String(notes || "").trim(),

              status:
                "paid",

              paidAt,

              createdAt:
                paidAt,

              processedBy:
                req.owner.username ||
                "owner"

            }
          );


          firestoreTransaction.update(
            affiliateRef,
            {

              unpaidCommission:
                remainingUnpaidCommission,

              lastPayoutAt:
                paidAt

            }
          );

        }
      );


      /* =========================================
         RESPONSE
         ========================================= */

      return res.json({

        success: true,

        message:
          "Affiliate payout recorded successfully.",

        payout: {

          payoutId,

          affiliateId,

          affiliateName:
            affiliate.fullName || "",

          amount:
            payoutAmount,

          currency:
            "KES",

          method:
            payoutMethod,

          reference:
            payoutReference,

          status:
            "paid",

          paidAt

        }

      });


    } catch (error) {

      console.error(
        "Affiliate payout error:",
        error
      );


      if (
        error.message ===
        "AFFILIATE_NOT_FOUND"
      ) {

        return res.status(404).json({

          success: false,

          message:
            "Affiliate account could not be found."

        });

      }


      if (
        error.message ===
        "NO_UNPAID_COMMISSION"
      ) {

        return res.status(409).json({

          success: false,

          message:
            "This affiliate has no unpaid commission available for payout."

        });

      }


      if (
        error.message ===
        "PAYOUT_EXCEEDS_BALANCE"
      ) {

        return res.status(409).json({

          success: false,

          message:
            "The payout amount exceeds the affiliate's current unpaid commission."

        });

      }


      return res.status(500).json({

        success: false,

        message:
          "We couldn't record the affiliate payout."

      });

    }

  }
);

/* =========================================================
   AFFILIATE — PAYOUT HISTORY
   ========================================================= */

app.get(
  "/api/affiliate/payouts",
  authenticateAffiliate,
  async (req, res) => {

    try {

      const affiliateId =
        req.affiliate.affiliateId;

      /* =========================================
         GET PAYOUTS
         ========================================= */

      const snapshot =
        await db
          .collection("affiliate_payouts")
          .where(
            "affiliateId",
            "==",
            affiliateId
          )
          .get();


      /* =========================================
         BUILD PAYOUT LIST
         ========================================= */

      const payouts =
        snapshot.docs.map(doc => {

          const payout =
            doc.data();

          return {

            payoutId:
              payout.payoutId ||
              doc.id,

            amount:
              Number(
                payout.amount || 0
              ),

            currency:
              payout.currency ||
              "KES",

            method:
              payout.method ||
              "external",

            reference:
              payout.reference ||
              "",

            notes:
              payout.notes ||
              "",

            status:
              payout.status ||
              "paid",

            paidAt:
              payout.paidAt ||
              payout.createdAt ||
              null

          };

        });


      /* =========================================
         SORT — NEWEST PAYOUT FIRST
         ========================================= */

      payouts.sort((a, b) => {

        return (
          new Date(b.paidAt || 0) -
          new Date(a.paidAt || 0)
        );

      });


      /* =========================================
         RESPONSE
         ========================================= */

      return res.json({

        success: true,

        count:
          payouts.length,

        payouts

      });

    } catch (error) {

      console.error(
        "Affiliate payout history error:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "We couldn't load your payout history."

      });

    }

  }
);

/* =========================================================
   11. AFFILIATE PROFILE
   ========================================================= */

app.get(
  "/api/affiliate/me",
  authenticateAffiliate,
  async(req,res)=>{

    try{

      const affiliateRef=
        db
          .collection("affiliates")
          .doc(req.affiliate.affiliateId);

      const affiliateSnapshot=
        await affiliateRef.get();


      if(!affiliateSnapshot.exists){

        return res.status(404).json({
          success:false,
          message:
            "Affiliate account could not be found."
        });

      }


      const affiliate=
        affiliateSnapshot.data();


      return res.json({

        success:true,

        affiliate:{
          affiliateId:
            affiliateSnapshot.id,

          fullName:
            affiliate.fullName||"",

          email:
            affiliate.email||"",

          phone:
            affiliate.phone||"",

          status:
            affiliate.status||"pending",

          createdAt:
            affiliate.createdAt||null

        }

      });

    }catch(error){

      console.error(
        "Affiliate profile error:",
        error
      );

      return res.status(500).json({
        success:false,
        message:
          "We couldn't load your affiliate profile."
      });

    }

  }
);



/* =========================================================
   12. AFFILIATE DASHBOARD
   ========================================================= */

app.get(
  "/api/affiliate/dashboard",
  authenticateAffiliate,
  async (req, res) => {

    try {

      const affiliateRef =
        db
          .collection("affiliates")
          .doc(req.affiliate.affiliateId);

      const affiliateSnapshot =
        await affiliateRef.get();


      if (!affiliateSnapshot.exists) {

        return res.status(404).json({
          success: false,
          message:
            "Affiliate account could not be found."
        });

      }


      const affiliate =
        affiliateSnapshot.data();


      return res.json({

        success: true,

        affiliate: {

          affiliateId:
            affiliateSnapshot.id,

          fullName:
            affiliate.fullName || "",

          email:
            affiliate.email || "",

          phone:
            affiliate.phone || "",

          status:
            affiliate.status || "pending",

          referralCode:
            affiliate.referralCode || "",

          commissionRate:
            Number(
              affiliate.commissionRate || 0
            ),

          totalSales:
            Number(
              affiliate.totalSales || 0
            ),

          totalSalesAmount:
            Number(
              affiliate.totalSalesAmount || 0
            ),

          totalCommission:
            Number(
              affiliate.totalCommission || 0
            ),

          unpaidCommission:
            Number(
              affiliate.unpaidCommission || 0
            ),

          lastPayoutAt:
            affiliate.lastPayoutAt || null,

          createdAt:
            affiliate.createdAt || null

        }

      });

    } catch (error) {

      console.error(
        "Affiliate dashboard error:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "We couldn't load your affiliate dashboard."

      });

    }

  }
);

/* =========================================================
   13B-3. AFFILIATE REFERRAL LINK
   ========================================================= */

app.get(
  "/api/affiliate/referral-link",
  authenticateAffiliate,
  async(req,res)=>{

    try{

      const affiliateRef =
        db
          .collection("affiliates")
          .doc(req.affiliate.affiliateId);


      const affiliateSnapshot =
        await affiliateRef.get();


      if(!affiliateSnapshot.exists){

        return res.status(404).json({

          success:false,

          message:
            "Affiliate account could not be found."

        });

      }


      const affiliate =
        affiliateSnapshot.data();


      /* =====================================================
         ACCOUNT STATUS
         ===================================================== */

      if(affiliate.status!=="approved"){

        return res.status(403).json({

          success:false,

          message:
            "Your affiliate account is not currently approved."

        });

      }


      /* =====================================================
         REFERRAL CODE
         ===================================================== */

      if(!affiliate.referralCode){

        return res.status(500).json({

          success:false,

          message:
            "Your affiliate referral code could not be found."

        });

      }


      /* =====================================================
         CREATE REFERRAL LINK
         ===================================================== */

      const frontendUrl =
        process.env.FRONTEND_URL ||
        (
          process.env.NODE_ENV === "production"
            ? "https://remify.co"
            : "http://localhost:5500"
        ).replace(/\/+$/, "");


      const referralLink =
        `${frontendUrl}/?ref=${encodeURIComponent(
          affiliate.referralCode
        )}`;


      /* =====================================================
         RESPONSE
         ===================================================== */

      return res.json({

        success:true,

        referralCode:
          affiliate.referralCode,

        referralLink

      });

    }catch(error){

      console.error(
        "Affiliate referral link error:",
        error
      );


      return res.status(500).json({

        success:false,

        message:
          "We couldn't load your referral link."

      });

    }

  }
);



/* =========================================================
   13B-2. TEST REFERRAL CODE
   ========================================================= */

app.post(
  "/api/affiliate/test-referral-code",
  async(req,res)=>{

    try{

      const email =
        "testaffiliate@example.com";

      const snapshot =
        await db
          .collection("affiliates")
          .where("email","==",email)
          .limit(1)
          .get();


      if(snapshot.empty){

        return res.status(404).json({
          success:false,
          message:
            "Test affiliate could not be found."
        });

      }


      const affiliateDoc =
        snapshot.docs[0];

      const affiliate =
        affiliateDoc.data();


      if(affiliate.referralCode){

        return res.json({
          success:true,
          message:
            "Affiliate already has a referral code.",
          referralCode:
            affiliate.referralCode
        });

      }


      const referralCode =
        await generateReferralCode();


      await affiliateDoc.ref.update({

        referralCode

      });


      return res.json({

        success:true,

        message:
          "Referral code created successfully.",

        referralCode

      });

    }catch(error){

      console.error(
        "Test referral code error:",
        error
      );

      return res.status(500).json({

        success:false,

        message:
          "Couldn't create the referral code."

      });

    }

  }
);


/* =========================================================
   07. PAYMENT INITIALIZATION
   ========================================================= */

app.post("/api/payment/initialize", async (req, res) => {

  try {

    const {
      productId,
      quantity,
      customer,
      delivery,
      affiliateCode
    } = req.body;

    /* =====================================================
   AFFILIATE REFERRAL
   ===================================================== */

let verifiedAffiliate = null;

if (affiliateCode) {

  const normalizedAffiliateCode =
    String(affiliateCode)
      .trim()
      .toUpperCase();

  const affiliateSnapshot =
    await db
      .collection("affiliates")
      .where(
        "referralCode",
        "==",
        normalizedAffiliateCode
      )
      .where(
        "status",
        "==",
        "approved"
      )
      .limit(1)
      .get();

  if (!affiliateSnapshot.empty) {

    const affiliateDoc =
      affiliateSnapshot.docs[0];

    const affiliate =
      affiliateDoc.data();

    verifiedAffiliate = {
      affiliateId:
        affiliateDoc.id,

      referralCode:
        affiliate.referralCode,

      commissionRate:
        Number(
          affiliate.commissionRate || 0.20
        )
    };

  }

}

console.log(
  "Verified affiliate:",
  verifiedAffiliate || "none"
);


    /* =====================================================
       PRODUCT VALIDATION
       ===================================================== */

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product information is missing."
      });
    }

    const product = products[String(productId)];

    if (!product) {
      return res.status(400).json({
        success: false,
        message: "The selected product could not be found."
      });
    }


    /* =====================================================
       QUANTITY VALIDATION
       ===================================================== */

    const parsedQuantity = Number(quantity);

    if (
      !Number.isInteger(parsedQuantity) ||
      parsedQuantity < 1 ||
      parsedQuantity > 20
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid quantity."
      });
    }


    /* =====================================================
       CUSTOMER VALIDATION
       ===================================================== */

    if (!customer?.fullName?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Full name is required."
      });
    }

    if (!customer?.email?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email address is required."
      });
    }

    if (!customer?.phone?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required."
      });
    }


    /* =====================================================
       DELIVERY VALIDATION
       ===================================================== */

    if (!delivery?.country?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Country is required."
      });
    }

    if (!delivery?.city?.trim()) {
      return res.status(400).json({
        success: false,
        message: "City is required."
      });
    }

    if (!delivery?.address?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Delivery address is required."
      });
    }


    /* =====================================================
       BACKEND PRICE CALCULATION
       ===================================================== */

    const unitPrice = Number(product.price);

    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      console.error(
        "Invalid product price:",
        product
      );

      return res.status(500).json({
        success: false,
        message: "The selected product currently has an invalid price."
      });
    }

    const currency =
      String(product.currency || "KES").toUpperCase();

    const totalAmount =
      unitPrice * parsedQuantity;


    /* =====================================================
       PAYMENT REFERENCE
       ===================================================== */

    const paymentReference = generateReference();
const pendingOrder = {
  productId: product.id,

  productName: product.name,

  quantity: parsedQuantity,

  unitPrice,

  amount: totalAmount,

  currency,

  customer: {
    fullName: customer.fullName.trim(),
    email: customer.email.trim(),
    phone: customer.phone.trim()
  },

  delivery: {
    country: delivery.country.trim(),
    city: delivery.city.trim(),
    address: delivery.address.trim(),
    apartment:
      delivery.apartment?.trim() || ""
  },

  affiliateCode:
    verifiedAffiliate?.referralCode || null,

  reference: paymentReference,

  paymentStatus: "pending",

  createdAt:
    new Date().toISOString()
};

await db
  .collection("pending_orders")
  .doc(paymentReference)
  .set(pendingOrder);


    /* =====================================================
       TRUSTED ORDER DATA
       ===================================================== */

    const metadata = {

      productId: product.id,

      productName: product.name,

      quantity: parsedQuantity,

      unitPrice,

      totalAmount,

      currency,

      customer: {
        fullName: customer.fullName.trim(),
        email: customer.email.trim(),
        phone: customer.phone.trim()
      },

      delivery: {
        country: delivery.country.trim(),
        city: delivery.city.trim(),
        address: delivery.address.trim(),
        apartment: delivery.apartment?.trim() || ""
      }

    };


    /* =====================================================
       PAYSTACK AMOUNT
       ===================================================== */

    const paystackAmount =
      Math.round(totalAmount * 100);


    /* =====================================================
       INITIALIZE PAYSTACK
       ===================================================== */

    const result = await paystackRequest(
      "/transaction/initialize",
      {
        method: "POST",

        body: JSON.stringify({

          email: customer.email.trim(),

          amount: String(paystackAmount),

          currency,

          reference: paymentReference,

        callback_url:
          `${String(
            process.env.FRONTEND_URL ||
            "http://localhost:5500"
          ).replace(/\/+$/, "")}/confirmation.html`,

          metadata: JSON.stringify(metadata)

        })
      }
    );

    /* =====================================================
       RESPONSE
       ===================================================== */

    return res.json({

      success: true,

      accessCode:
        result.data.access_code,

      authorizationUrl:
        result.data.authorization_url,

      reference:
        result.data.reference,

      product: {
        id: product.id,
        name: product.name
      },

      quantity: parsedQuantity,

      unitPrice,

      totalAmount,

      currency

    });

  } catch (error) {

    console.error(
      "Payment initialization error:",
      error
    );

    return res.status(500).json({

      success: false,

      message:
        "We couldn't prepare your payment. Please try again."

    });

  }

});


/* =========================================================
   08. PAYMENT VERIFICATION
   ========================================================= */

app.post("/api/payment/verify", async (req, res) => {

  try {

    const { reference } = req.body;


    /* =====================================================
       VALIDATE REFERENCE
       ===================================================== */

    if (!reference) {

      return res.status(400).json({
        success: false,
        message:
          "Payment reference is missing."
      });

    }


    /* =====================================================
       GET PENDING ORDER
       ===================================================== */

    const pendingOrderSnapshot =
      await db
        .collection("pending_orders")
        .doc(reference)
        .get();


    if (!pendingOrderSnapshot.exists) {

      console.error(
        "Pending order not found:",
        reference
      );

      return res.status(400).json({
        success: false,
        message:
          "The order associated with this payment could not be found."
      });

    }


    const order =
      pendingOrderSnapshot.data();


    /* =====================================================
       VERIFY PAYMENT WITH PAYSTACK
       ===================================================== */

    const result =
      await paystackRequest(
        `/transaction/verify/${encodeURIComponent(reference)}`,
        {
          method: "GET"
        }
      );


    const transaction =
      result.data;


    /* =====================================================
       CHECK PAYMENT STATUS
       ===================================================== */

    if (
      transaction.status !== "success"
    ) {

      let message =
        "Your payment was not completed.";


      if (
        transaction.status ===
        "abandoned"
      ) {

        message =
          "The payment window was closed before payment was completed.";

      } else if (
        transaction.status ===
        "failed"
      ) {

        message =
          transaction.gateway_response ||
          "Paystack could not complete the payment.";

      } else if (
        transaction.status ===
          "pending" ||
        transaction.status ===
          "ongoing" ||
        transaction.status ===
          "processing"
      ) {

        message =
          "Your payment is still being processed. Please wait a moment and try again.";

      }


      return res.status(400).json({

        success: false,

        paymentStatus:
          transaction.status,

        message

      });

    }


    /* =====================================================
       VERIFY PRODUCT
       ===================================================== */

    const verifiedProduct =
      products[
        String(order.productId)
      ];


    if (!verifiedProduct) {

      console.error(
        "Product not found during payment verification:",
        order.productId
      );

      return res.status(400).json({

        success: false,

        message:
          "The product associated with this payment could not be verified."

      });

    }


    /* =====================================================
       VERIFY QUANTITY
       ===================================================== */

    const verifiedQuantity =
      Number(order.quantity);


    if (
      !Number.isInteger(
        verifiedQuantity
      ) ||
      verifiedQuantity < 1 ||
      verifiedQuantity > 20
    ) {

      return res.status(400).json({

        success: false,

        message:
          "The order quantity could not be verified."

      });

    }


    /* =====================================================
       VERIFY PRODUCT PRICE
       ===================================================== */

    const verifiedUnitPrice =
      Number(
        verifiedProduct.price
      );


    if (
      !Number.isFinite(
        verifiedUnitPrice
      ) ||
      verifiedUnitPrice <= 0
    ) {

      return res.status(500).json({

        success: false,

        message:
          "The product price could not be verified."

      });

    }


    /* =====================================================
       VERIFY AMOUNT
       ===================================================== */

    const expectedAmount =
      Math.round(
        verifiedUnitPrice *
        verifiedQuantity *
        100
      );


    const paidAmount =
      Number(
        transaction.amount || 0
      );


    /* =====================================================
       VERIFY CURRENCY
       ===================================================== */

    const expectedCurrency =
      String(
        verifiedProduct.currency ||
        "KES"
      ).toUpperCase();


    const paidCurrency =
      String(
        transaction.currency || ""
      ).toUpperCase();


    /* =====================================================
       AMOUNT / CURRENCY SECURITY CHECK
       ===================================================== */

    if (
      expectedAmount <= 0 ||
      paidAmount !== expectedAmount ||
      paidCurrency !== expectedCurrency
    ) {

      console.error(
        "Payment amount/currency mismatch:",
        {
          expectedAmount,
          paidAmount,
          expectedCurrency,
          paidCurrency,
          reference
        }
      );


      return res.status(400).json({

        success: false,

        message:
          "Payment verification failed because the payment amount could not be matched to your order. Please contact Remify."

      });

    }


    /* =====================================================
       DUPLICATE ORDER PROTECTION
       ===================================================== */

    const existingOrder =
      await db
        .collection("orders")
        .doc(reference)
        .get();


    if (existingOrder.exists) {

      console.log(
        "Order already processed:",
        reference
      );


      return res.json({

        success: true,

        message:
          "Payment has already been verified.",

        reference

      });

    }


    /* =====================================================
       AFFILIATE ORDER + TOTALS
       ===================================================== */

    if (order.affiliateCode) {

      try {

        const normalizedAffiliateCode =
          String(
            order.affiliateCode
          )
            .trim()
            .toUpperCase();


        const affiliateSnapshot =
          await db
            .collection("affiliates")
            .where(
              "referralCode",
              "==",
              normalizedAffiliateCode
            )
            .where(
              "status",
              "==",
              "approved"
            )
            .limit(1)
            .get();


        if (
          !affiliateSnapshot.empty
        ) {

          const affiliateDoc =
            affiliateSnapshot.docs[0];


          const affiliate =
            affiliateDoc.data();


          const commissionRate =
            Number(
              affiliate.commissionRate ||
              0.20
            );


          const saleAmount =
            verifiedUnitPrice *
            verifiedQuantity;


          const commissionAmount =
            Number(
              (
                saleAmount *
                commissionRate
              ).toFixed(2)
            );


          const affiliateOrderRef =
            db
              .collection(
                "affiliate_orders"
              )
              .doc(reference);


          const affiliateRef =
            db
              .collection("affiliates")
              .doc(
                affiliateDoc.id
              );


          /* =============================================
             FIRESTORE TRANSACTION
             ============================================= */

          await db.runTransaction(
            async firestoreTransaction => {

              const existingAffiliateOrder =
                await firestoreTransaction.get(
                  affiliateOrderRef
                );


              /* =========================================
                 DUPLICATE PROTECTION
                 ========================================= */

              if (
                existingAffiliateOrder.exists
              ) {

                console.log(
                  "Affiliate order already exists:",
                  reference
                );

                return;

              }


              /* =========================================
                 CURRENT TOTALS
                 ========================================= */

              const currentTotalSales =
                Number(
                  affiliate.totalSales ||
                  0
                );


              const currentSalesAmount =
                Number(
                  affiliate.totalSalesAmount ||
                  0
                );


              const currentTotalCommission =
                Number(
                  affiliate.totalCommission ||
                  0
                );


              const currentUnpaidCommission =
                Number(
                  affiliate.unpaidCommission ||
                  0
                );


              /* =========================================
                 NEW TOTALS
                 ========================================= */

              const newTotalSales =
                currentTotalSales + 1;


              const newSalesAmount =
                Number(
                  (
                    currentSalesAmount +
                    saleAmount
                  ).toFixed(2)
                );


              const newTotalCommission =
                Number(
                  (
                    currentTotalCommission +
                    commissionAmount
                  ).toFixed(2)
                );


              const newUnpaidCommission =
                Number(
                  (
                    currentUnpaidCommission +
                    commissionAmount
                  ).toFixed(2)
                );


              /* =========================================
                 CREATE AFFILIATE ORDER
                 ========================================= */

              firestoreTransaction.set(
                affiliateOrderRef,
                {

                  paymentReference:
                    reference,

                  affiliateId:
                    affiliateDoc.id,

                  referralCode:
                    affiliate.referralCode,

                  productId:
                    verifiedProduct.id,

                  productName:
                    verifiedProduct.name,

                  quantity:
                    verifiedQuantity,

                  saleAmount,

                  commissionRate,

                  commissionAmount,

                  commissionStatus:
                    "unpaid",

                  paymentStatus:
                    "success",

                  paidAt:
                    transaction.paid_at ||
                    new Date().toISOString(),

                  createdAt:
                    new Date().toISOString()

                }
              );


              /* =========================================
                 UPDATE AFFILIATE TOTALS
                 ========================================= */

              firestoreTransaction.update(
                affiliateRef,
                {

                  totalSales:
                    newTotalSales,

                  totalSalesAmount:
                    newSalesAmount,

                  totalCommission:
                    newTotalCommission,

                  unpaidCommission:
                    newUnpaidCommission

                }
              );

            }
          );


          console.log(
            "Affiliate order and totals recorded:",
            {
              paymentReference:
                reference,

              affiliateId:
                affiliateDoc.id,

              saleAmount,

              commissionAmount
            }
          );

        }

      } catch (
        affiliateError
      ) {

        console.error(
          "Affiliate order recording error:",
          affiliateError
        );

      }

    }


    /* =====================================================
       CREATE VERIFIED ORDER
       ===================================================== */

    const verifiedOrder = {

      ...order,

      productId:
        verifiedProduct.id,

      productName:
        verifiedProduct.name,

      quantity:
        verifiedQuantity,

      unitPrice:
        verifiedUnitPrice,

      amount:
        verifiedUnitPrice *
        verifiedQuantity,

      currency:
        expectedCurrency,

      reference,

      paymentStatus:
        "success",

      paymentChannel:
        transaction.channel || "",

      paidAt:
        transaction.paid_at ||
        new Date().toISOString()

    };


    /* =====================================================
       SAVE VERIFIED ORDER
       ===================================================== */

    await db
      .collection("orders")
      .doc(reference)
      .set(
        verifiedOrder
      );


    /* =====================================================
       SEND OWNER EMAIL
       ===================================================== */

    await sendOwnerOrderEmail(
      verifiedOrder
    );


    /* =====================================================
       SEND CUSTOMER EMAIL
       ===================================================== */

    await sendCustomerConfirmationEmail(
      verifiedOrder
    );


    /* =====================================================
       MARK PENDING ORDER AS COMPLETED
       ===================================================== */

    await db
      .collection("pending_orders")
      .doc(reference)
      .update({

        paymentStatus:
          "success",

        completedAt:
          new Date().toISOString()

      });


    /* =====================================================
       SUCCESS
       ===================================================== */

    return res.json({

      success: true,

      message:
        "Payment verified and order received.",

      reference

    });


  } catch (error) {

    console.error(
      "Payment verification error:",
      error
    );


    return res.status(500).json({

      success: false,

      message:
        "We verified the payment request but couldn't complete the order notification. Please contact Remify with your payment reference."

    });

  }

});

/* =========================================================
   09. OWNER ORDER EMAIL
   ========================================================= */

const sendOwnerOrderEmail=async(order)=>{

  const total=formatPrice(
    order.amount,
    order.currency
  );

  const subject=
    `New Remify Order — ${order.reference}`;

  const html=`

<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>New Remify Order</title>
</head>

<body style="
margin:0;
padding:0;
background:#f6f4f7;
font-family:Arial,Helvetica,sans-serif;
color:#171717;
">

<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
<tr>
<td align="center">

<table width="100%" cellpadding="0" cellspacing="0" style="
max-width:680px;
background:#ffffff;
border-radius:18px;
overflow:hidden;
">

<tr>
<td style="
padding:34px 38px;
background:#5b2d82;
color:#ffffff;
">

<div style="
font-size:13px;
letter-spacing:4px;
font-weight:bold;
">
REMIFY
</div>

<div style="
font-size:28px;
font-weight:bold;
margin-top:18px;
">
New order received.
</div>

<div style="
font-size:13px;
margin-top:8px;
opacity:.8;
">
Payment has been successfully verified.
</div>

</td>
</tr>

<tr>
<td style="padding:36px 38px;">

<div style="
font-size:11px;
letter-spacing:2px;
color:#777;
font-weight:bold;
">
ORDER REFERENCE
</div>

<div style="
font-size:18px;
font-weight:bold;
margin-top:7px;
">
${escapeHTML(order.reference)}
</div>

<hr style="
border:0;
border-top:1px solid #eeeeee;
margin:28px 0;
">

<div style="
font-size:11px;
letter-spacing:2px;
color:#777;
font-weight:bold;
">
CUSTOMER
</div>

<div style="margin-top:12px;font-size:16px;font-weight:bold;">
${escapeHTML(order.customer.fullName)}
</div>

<div style="margin-top:5px;color:#666;">
${escapeHTML(order.customer.email)}
</div>

<div style="margin-top:5px;color:#666;">
${escapeHTML(order.customer.phone)}
</div>

<hr style="
border:0;
border-top:1px solid #eeeeee;
margin:28px 0;
">

<div style="
font-size:11px;
letter-spacing:2px;
color:#777;
font-weight:bold;
">
ORDER
</div>

<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;">
<tr>
<td style="padding:8px 0;font-weight:bold;">
${escapeHTML(order.productName)}
</td>
<td align="right" style="padding:8px 0;">
× ${escapeHTML(order.quantity)}
</td>
</tr>
<tr>
<td style="padding:8px 0;color:#777;">
Subtotal
</td>
<td align="right" style="padding:8px 0;font-weight:bold;">
${escapeHTML(total)}
</td>
</tr>
</table>

<hr style="
border:0;
border-top:1px solid #eeeeee;
margin:28px 0;
">

<div style="
font-size:11px;
letter-spacing:2px;
color:#777;
font-weight:bold;
">
DELIVERY
</div>

<div style="margin-top:14px;line-height:1.7;color:#444;">
${escapeHTML(order.delivery.country)}<br>
${escapeHTML(order.delivery.city)}<br>
${escapeHTML(order.delivery.address)}
${
  order.delivery.apartment
    ? `<br>${escapeHTML(order.delivery.apartment)}`
    : ""
}
</div>

<hr style="
border:0;
border-top:1px solid #eeeeee;
margin:28px 0;
">

<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td style="font-size:16px;font-weight:bold;">
Payment
</td>
<td align="right" style="
font-size:16px;
font-weight:bold;
color:#5b2d82;
">
CONFIRMED
</td>
</tr>
</table>

<div style="
margin-top:20px;
padding:14px 16px;
background:#f7f3fa;
border-radius:10px;
font-size:12px;
color:#666;
">
Paystack reference:
<strong>${escapeHTML(order.reference)}</strong>
</div>

</td>
</tr>

<tr>
<td style="
padding:24px 38px;
background:#fafafa;
font-size:11px;
color:#888;
">
REMIFY © 2026<br>
Fresh. Natural. Made with intention.
</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
`;

  await mailer.sendMail({
    from:`Remify <${process.env.SMTP_USER}>`,
    to:OWNER_EMAIL,
    subject,
    html
  });
};


/* =========================================================
   10. CUSTOMER CONFIRMATION EMAIL
   ========================================================= */
/* =========================================================
   AFFILIATE APPROVAL EMAIL
   ========================================================= */

const sendAffiliateApprovalEmail = async (affiliate) => {

  const firstName =
    String(affiliate.fullName || "")
      .trim()
      .split(/\s+/)[0] || "there";


  const commissionRate =
    Number(
      affiliate.commissionRate ?? 0.20
    ) * 100;


  const dashboardUrl =
    `${FRONTEND_URL}/affiliate-dashboard.html`;


  const subject =
    "Your Remify affiliate application has been approved ✦";


  const html = `

<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width,initial-scale=1.0"
>

<title>
Remify Affiliate Approval
</title>

</head>


<body style="
margin:0;
padding:0;
background:#f6f4f7;
font-family:Arial,Helvetica,sans-serif;
color:#171717;
">


<table
  width="100%"
  cellpadding="0"
  cellspacing="0"
  style="padding:40px 16px;"
>

<tr>

<td align="center">


<table
  width="100%"
  cellpadding="0"
  cellspacing="0"
  style="
  max-width:620px;
  background:#ffffff;
  border-radius:18px;
  overflow:hidden;
  "
>


<!-- HEADER -->

<tr>

<td style="
padding:38px;
background:#5b2d82;
color:#ffffff;
">


<div style="
font-size:13px;
letter-spacing:4px;
font-weight:bold;
">

REMIFY

</div>


<div style="
font-size:30px;
font-weight:bold;
margin-top:22px;
">

You're approved.

</div>


<div style="
font-size:14px;
margin-top:10px;
line-height:1.6;
opacity:.85;
">

Welcome to the Remify Affiliate Program.

</div>


</td>

</tr>


<!-- CONTENT -->

<tr>

<td style="
padding:38px;
">


<p style="
font-size:16px;
line-height:1.7;
margin:0 0 24px;
">

Hi ${escapeHTML(firstName)},

</p>


<p style="
font-size:15px;
line-height:1.7;
margin:0 0 26px;
color:#444;
">

Your Remify affiliate application has been
approved. You can now log in to your affiliate
dashboard and start sharing your referral link.

</p>


<!-- COMMISSION -->

<div style="
padding:20px;
background:#faf8fb;
border-radius:12px;
margin-bottom:24px;
">


<div style="
font-size:11px;
letter-spacing:2px;
color:#777;
font-weight:bold;
">

YOUR COMMISSION

</div>


<div style="
font-size:28px;
font-weight:bold;
color:#5b2d82;
margin-top:8px;
">

${commissionRate}%

</div>


<div style="
font-size:12px;
color:#777;
margin-top:5px;
">

Per successful referred sale.

</div>


</div>


<!-- DASHBOARD BUTTON -->

<table
  cellpadding="0"
  cellspacing="0"
  style="margin:28px 0;"
>

<tr>

<td>

<a
  href="${escapeHTML(dashboardUrl)}"
  style="
  display:inline-block;
  padding:14px 22px;
  background:#5b2d82;
  color:#ffffff;
  text-decoration:none;
  border-radius:9px;
  font-size:14px;
  font-weight:bold;
  "
>

Open Affiliate Dashboard

</a>

</td>

</tr>

</table>


<p style="
font-size:13px;
line-height:1.7;
color:#777;
margin:26px 0 0;
">

Your commissions will be accumulated and paid
once at the end of each month.

</p>


</td>

</tr>


<!-- FOOTER -->

<tr>

<td style="
padding:25px 38px;
background:#fafafa;
font-size:11px;
line-height:1.7;
color:#888;
">


<strong style="
color:#5b2d82;
">

REMIFY

</strong>

<br>

Fresh. Natural. Made with intention.

<br>

© 2026 Remify


</td>

</tr>


</table>


</td>

</tr>

</table>


</body>

</html>

`;


  await mailer.sendMail({

    from:
      `Remify <${process.env.SMTP_USER}>`,

    to:
      affiliate.email,

    subject,

    html

  });

};

const sendCustomerConfirmationEmail=async(order)=>{

  const total=formatPrice(
    order.amount,
    order.currency
  );

  const subject=
    "Your Remify order has been received ✦";

  const html=`

<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Your Remify Order</title>
</head>

<body style="
margin:0;
padding:0;
background:#f6f4f7;
font-family:Arial,Helvetica,sans-serif;
color:#171717;
">

<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
<tr>
<td align="center">

<table width="100%" cellpadding="0" cellspacing="0" style="
max-width:620px;
background:#ffffff;
border-radius:18px;
overflow:hidden;
">

<tr>
<td style="
padding:38px;
background:#5b2d82;
color:#ffffff;
">

<div style="
font-size:13px;
letter-spacing:4px;
font-weight:bold;
">
REMIFY
</div>

<div style="
font-size:30px;
font-weight:bold;
margin-top:22px;
">
Thank you, ${escapeHTML(
  order.customer.fullName.split(" ")[0]
)}.
</div>

<div style="
font-size:14px;
margin-top:10px;
line-height:1.6;
opacity:.85;
">
Your order has been received and your payment has been confirmed.
</div>

</td>
</tr>

<tr>
<td style="padding:38px;">

<p style="
font-size:15px;
line-height:1.7;
margin:0 0 28px;
color:#444;
">
We're now working on your order. We'll take care of the next steps and contact you if we need anything else regarding your delivery.
</p>

<div style="
font-size:11px;
letter-spacing:2px;
color:#777;
font-weight:bold;
">
ORDER SUMMARY
</div>

<div style="
margin-top:14px;
padding:20px;
background:#faf8fb;
border-radius:12px;
">

<table width="100%" cellpadding="0" cellspacing="0">

<tr>
<td style="padding:7px 0;font-weight:bold;">
${escapeHTML(order.productName)}
</td>

<td align="right" style="padding:7px 0;">
× ${escapeHTML(order.quantity)}
</td>
</tr>

<tr>
<td style="padding:7px 0;color:#777;">
Total paid
</td>

<td align="right" style="
padding:7px 0;
font-weight:bold;
color:#5b2d82;
">
${escapeHTML(total)}
</td>
</tr>

</table>

</div>

<div style="
margin-top:26px;
padding:16px;
border:1px solid #eeeeee;
border-radius:10px;
font-size:12px;
color:#666;
line-height:1.6;
">
<strong>Order reference</strong><br>
${escapeHTML(order.reference)}
</div>

<p style="
margin:30px 0 0;
font-size:13px;
line-height:1.7;
color:#777;
">
Please keep this email for your records.
</p>

</td>
</tr>

<tr>
<td style="
padding:25px 38px;
background:#fafafa;
font-size:11px;
line-height:1.7;
color:#888;
">
<strong style="color:#5b2d82;">
REMIFY
</strong><br>
Fresh. Natural. Made with intention.<br>
© 2026 Remify
</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
`;

  await mailer.sendMail({
    from:`Remify <${process.env.SMTP_USER}>`,
    to:order.customer.email,
    subject,
    html
  });
};


/* =========================================================
   11. HEALTH CHECK
   ========================================================= */

app.get("/api/health",(req,res)=>{

  res.json({
    success:true,
    message:"Remify backend is running."
  });

});


/* =========================================================
   12. ERROR HANDLER
   ========================================================= */

app.use((error,req,res,next)=>{

  console.error(
    "Unhandled server error:",
    error
  );

  res.status(500).json({
    success:false,
    message:
      "Something went wrong on the server."
  });

});


/* =========================================================
   13. SERVER
   ========================================================= */

app.listen(PORT,async()=>{

  console.log(
    `Remify backend running on http://localhost:${PORT}`
  );

  await verifyMailer();

});