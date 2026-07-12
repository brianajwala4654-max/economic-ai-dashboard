* TITLE:  Macroeconomic Determinants of MSME Growth in Kenya (2010-2023)
clear all
macro drop _all
capture log close

cd "C:\Users\Admin\Downloads"

use "Cleaned dataset.dta", clear

tsset YEAR


* SECTION 1: DESCRIPTIVE STATISTICS

summarize GDPGR INF CORR ACCR, detail


* SECTION 2: STATIONARITY TESTS (ADF)

* Level form
dfuller GDPGR, lags(1)
dfuller INF, lags(1)
dfuller CORR, lags(1)
dfuller ACCR, lags(1)

* First differences
dfuller GDPGR, lags(1) regress
dfuller INF, lags(1) regress
dfuller CORR, lags(1) regress
dfuller ACCR, lags(1) regress


* SECTION 3: ARDL MODEL SELECTION AND ESTIMATION (AIC)
ardl GDPGR INF CORR ACCR, maxlags(1) aic


* SECTION 4: DIAGNOSTIC TESTS
regress GDPGR INF CORR ACCR
estat bgodfrey
estat hettest