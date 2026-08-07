const BASE_URL = 'https://nexus-economics.onrender.com';

export async function getInflationData(country = 'Kenya') {
  try {
    const response = await fetch(`${BASE_URL}/api/inflation/${country}`);
    const data = await response.json();
    return data.observations || [];
  } catch (error) {
    console.error('Error fetching inflation data:', error);
    return [];
  }
}

export async function getExchangeRate() {
  try {
    const response = await fetch(`${BASE_URL}/api/exchange`);
    const data = await response.json();
    return {
      KES: data.conversion_rates.KES,
      UGX: data.conversion_rates.UGX,
      TZS: data.conversion_rates.TZS,
      RWF: data.conversion_rates.RWF,
      ETB: data.conversion_rates.ETB,
    };
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    return null;
  }
}

export async function getNews(country = 'Kenya') {
  try {
    const response = await fetch(`${BASE_URL}/api/news?country=${country}`);
    const data = await response.json();
    return (data.articles || []).slice(0, 5);
  } catch (error) {
    console.error('Error fetching news:', error);
    return [];
  }
}