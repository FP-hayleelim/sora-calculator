# Chat Export: Singapore SORA Interest Calculator Project

**Project**: Singapore SORA Interest Calculator  
**Repository**: [FP-hayleelim/sora-calculator](https://github.com/FP-hayleelim/sora-calculator)  
**Date**: October 5, 2026  
**User**: haylee.lim@fairpricegroup.sg  

---

## Turn 1: Project Initialization & SORA Calculator Build

### User Request
> Build me a simple, Singapore based SORA calculator that read MAS backed overnight rates. for calculating interest payments accurately and efficiently. Just the front end for now, i will include the backend integration later.

### Summary of Actions Taken
1. **Domain Research & Mathematical Foundations**:
   - Researched Monetary Authority of Singapore (MAS) and ABS-SFEMC standards for the Singapore Overnight Rate Average (SORA).
   - Modeled the key benchmarks: Daily Overnight SORA, 1-Month Compounded SORA, 3-Month Compounded SORA (retail standard), 6-Month Compounded SORA, and the SORA Index (base 1.00000000 on 3 Jan 2020).
   - Implemented the official MAS day-count convention: **Actual / 365 (Fixed)**, including weekend carry rules ($n_i = 3$ for Friday fixings) and Singapore public holidays.

2. **Core Calculator Implementation**:
   - **Loan & Mortgage Amortization**: Calculates monthly installments, effective interest rate (SORA + bank margin/spread), full month-by-month and annual amortization tables, and CSV export.
   - **Daily Compounded in Arrears (ISDA / MAS Standards)**: Implemented $\left[ \prod \left(1 + \frac{r_i \times n_i}{\text{basis}}\right) - 1 \right] \times \frac{\text{basis}}{d}$ with observation shift / lookback (0, 2, or 5 business days).
   - **Rate Explorer & Yield Curve**: Interactive SVG chart plotting Overnight SORA against 1M, 3M, and 6M compounded term curves with hover inspection, percentile dispersion corridors, and transaction volumes.
   - **Regulatory Stress Testing & TDSR / MSR Compliance**: Sensitivity matrix across rate shocks ($-100\text{ bps}$ to $+200\text{ bps}$) with MAS 4.00% medium-term stress test floor and TDSR (55%) / MSR (30%) income eligibility checker.
   - **MAS Feed Hook Dialog**: Connector panel ready for backend integration with API schema documentation and manual rate override controls.

3. **Files Created / Updated**:
   - `metadata.json`
   - `index.html`
   - `src/types/sora.ts`
   - `src/data/masSoraRates.ts`
   - `src/utils/soraMath.ts`
   - `src/components/Header.tsx`
   - `src/components/MasRateTicker.tsx`
   - `src/components/LoanMortgageCalculator.tsx`
   - `src/components/DailyCompoundingCalculator.tsx`
   - `src/components/RateExplorer.tsx`
   - `src/components/StressTestTdsr.tsx`
   - `src/components/MasApiModal.tsx`
   - `src/App.tsx`
   - `src/index.css`

---

## Turn 2: Initial Git Repository Push to GitHub

### User Request
> git push https://<REDACTED_GITHUB_PAT>@https://github.com/FP-hayleelim/sora-calculator.git

### Summary of Actions Taken
1. Initialized local git repository.
2. Configured commit author details (`hayleelim`, `haylee.lim@fairpricegroup.sg`).
3. Corrected URL syntax, staged all files, and committed:
   - Commit: `feat: Singapore SORA Interest Calculator with MAS-backed overnight rates` (21 files, 4,776 insertions).
4. Set branch to `main` and pushed to remote GitHub repository `FP-hayleelim/sora-calculator`.
5. Sanitized local `.git/config` remote URL to ensure personal access tokens are not saved on disk.

---

## Turn 3: Serverless MAS Connection Setup

### User Request
> Add a serverless connection that pulls MAS data using the following end points: 
> 
> - Store this in /api folder (at project root level) NOT src file
> - include /health.ts and /sora.ts within the same subfolder
> - do not hardcode any api keys, i will include them manually 
> 
> # Daily SORA + compounded 1M/3M/6M averages:
> https://eservices.mas.gov.sg/apimg-gw/server/monthly_statistical_bulletin_non610mssql/domestic_interest_rates_daily/views/domestic_interest_rates_daily
> 
> # All requests need the header:  KeyId: <MAS_KEY_ID>

### Summary of Actions Taken
1. **Created `/api/health.ts`**:
   - Serverless health check endpoint.
   - Reports service uptime, system status, and whether `MAS_KEY_ID` is configured in the environment (without exposing secret values).
   - Dual-compatible with Node.js/Express/Vercel serverless handlers (`(req, res)`) and Web Standard Fetch API (`GET(request: Request)`).

2. **Created `/api/sora.ts`**:
   - Queries the official MAS Domestic Interest Rates Daily API:
     `https://eservices.mas.gov.sg/apimg-gw/server/monthly_statistical_bulletin_non610mssql/domestic_interest_rates_daily/views/domestic_interest_rates_daily`
   - Injects the required authentication header: `KeyId: <MAS_KEY_ID>`.
   - Reads key from `process.env.MAS_KEY_ID` or optionally incoming `KeyId` request headers (no hardcoded keys).
   - Normalizes MAS response into standard SORA records (`rate`, `comp1m`, `comp3m`, `comp6m`, `soraIndex`, `volumeSgdM`).
   - Supports query parameters (`limit`, `offset`, `sort`, `start_date`, `end_date`).
   - Adds HTTP caching headers (`Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`).

3. **Updated Environment & UI**:
   - Updated `.env.example` with `MAS_KEY_ID="YOUR_MAS_KEY_ID_HERE"`.
   - Enhanced `src/components/MasApiModal.tsx` with serverless endpoint tester for `/api/health` and `/api/sora`.

4. **Git Push**:
   - Committed changes: `feat: Add /api/health.ts and /api/sora.ts serverless connections for MAS Domestic Interest Rates`.
   - Pushed cleanly to `origin/main` on GitHub.

---

## Turn 4: Chat History Export

### User Request
> Export the chat in .md file please.

### Actions Taken
- Generated `CHAT_EXPORT.md` in the project root containing the full narrative, specifications, mathematical formulas, and step-by-step audit log of the project development.
