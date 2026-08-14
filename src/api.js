const BASE_URL = "https://nexus-economics.onrender.com";

const WORLD_BANK_CODES = {
  Kenya: "KEN",
  Uganda: "UGA",
  Tanzania: "TZA",
  Rwanda: "RWA",
  Ethiopia: "ETH",
};

// ---------------------------------------------------------
// INFLATION
// ---------------------------------------------------------

export async function getInflationData(country = "Kenya") {
  try {
    const response = await fetch(
      `${BASE_URL}/api/inflation/${country}`
    );

    if (!response.ok) {
      throw new Error(
        `Inflation API error: ${response.status}`
      );
    }

    const data = await response.json();

    return data.observations || [];
  } catch (error) {
    console.error(
      "Error fetching inflation data:",
      error
    );

    return [];
  }
}

// ---------------------------------------------------------
// EXCHANGE RATES
// ---------------------------------------------------------

export async function getExchangeRate() {
  try {
    const response = await fetch(
      `${BASE_URL}/api/exchange`
    );

    if (!response.ok) {
      throw new Error(
        `Exchange API error: ${response.status}`
      );
    }

    const data = await response.json();

    return {
      KES: data.conversion_rates?.KES,
      UGX: data.conversion_rates?.UGX,
      TZS: data.conversion_rates?.TZS,
      RWF: data.conversion_rates?.RWF,
      ETB: data.conversion_rates?.ETB,
    };
  } catch (error) {
    console.error(
      "Error fetching exchange rate:",
      error
    );

    return null;
  }
}

// ---------------------------------------------------------
// NEWS
// ---------------------------------------------------------

export async function getNews(country = "Kenya") {
  try {
    const response = await fetch(
      `${BASE_URL}/api/news?country=${encodeURIComponent(
        country
      )}`
    );

    if (!response.ok) {
      throw new Error(
        `News API error: ${response.status}`
      );
    }

    const data = await response.json();

    return (data.articles || []).slice(0, 5);
  } catch (error) {
    console.error(
      "Error fetching news:",
      error
    );

    return [];
  }
}

// ---------------------------------------------------------
// WORLD BANK HELPER
// ---------------------------------------------------------

async function getWorldBankIndicator(
  countryCode,
  indicator
) {
  try {
    const response = await fetch(
      `https://api.worldbank.org/v2/country/${countryCode}/indicator/${indicator}?format=json&per_page=10`
    );

    if (!response.ok) {
      throw new Error(
        `World Bank API error: ${response.status}`
      );
    }

    const data = await response.json();

    if (
      !Array.isArray(data) ||
      !Array.isArray(data[1])
    ) {
      return [];
    }

    return data[1]
      .filter(
        (item) =>
          item.value !== null &&
          item.value !== undefined
      )
      .map((item) => ({
        year: item.date,
        value: Number(item.value),
      }))
      .sort(
        (a, b) =>
          Number(a.year) - Number(b.year)
      );
  } catch (error) {
    console.error(
      `World Bank indicator ${indicator} error:`,
      error
    );

    return [];
  }
}

// ---------------------------------------------------------
// GDP GROWTH
// ---------------------------------------------------------

export async function getGDPGrowth(
  country = "Kenya"
) {
  const countryCode =
    WORLD_BANK_CODES[country];

  if (!countryCode) return [];

  return getWorldBankIndicator(
    countryCode,
    "NY.GDP.MKTP.KD.ZG"
  );
}

// ---------------------------------------------------------
// UNEMPLOYMENT
// ---------------------------------------------------------

export async function getUnemployment(
  country = "Kenya"
) {
  const countryCode =
    WORLD_BANK_CODES[country];

  if (!countryCode) return [];

  return getWorldBankIndicator(
    countryCode,
    "SL.UEM.TOTL.ZS"
  );
}

// ---------------------------------------------------------
// CPI INFLATION - WORLD BANK
// ---------------------------------------------------------

export async function getWorldBankInflation(
  country = "Kenya"
) {
  const countryCode =
    WORLD_BANK_CODES[country];

  if (!countryCode) return [];

  return getWorldBankIndicator(
    countryCode,
    "FP.CPI.TOTL.ZG"
  );
}

// ---------------------------------------------------------
// FULL ECONOMIC PROFILE
// ---------------------------------------------------------

export async function getEconomicIndicators(
  country = "Kenya"
) {
  try {
    const [
      gdpGrowth,
      unemployment,
      inflation,
    ] = await Promise.all([
      getGDPGrowth(country),
      getUnemployment(country),
      getWorldBankInflation(country),
    ]);

    return {
      gdpGrowth,
      unemployment,
      inflation,
    };
  } catch (error) {
    console.error(
      "Economic indicators error:",
      error
    );

    return {
      gdpGrowth: [],
      unemployment: [],
      inflation: [],
    };
  }
}