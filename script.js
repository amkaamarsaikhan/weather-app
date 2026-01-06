// DOM элементүүдийг барьж авах
const cityInput = document.getElementById('cityInput');
const fetchBtn = document.getElementById('fetchBtn');
const clearBtn = document.getElementById('clearBtn');
const resultSection = document.getElementById('resultSection');
const lastSearchedSpan = document.getElementById('lastSearched');
const testApiBtn = document.getElementById('testApiBtn');

// 9. Огноо форматлах функц
function updateDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = new Date().toLocaleDateString('en-US', options);
    const dateElement = document.getElementById('currentDate');
    if (dateElement) dateElement.textContent = dateStr;
}
updateDate();

// 5. LocalStorage-оос сүүлийн хайлтыг авах
window.onload = () => {
    const savedCity = localStorage.getItem('lastCity');
    if (savedCity && lastSearchedSpan) {
        lastSearchedSpan.textContent = savedCity;
    }
};

// 10. Weather Icons болон тайлбар (WMO Code)
const weatherInfo = {
    0: { desc: 'Цэлмэг тэнгэр', icon: '☀️' },
    1: { desc: 'Голдуу цэлмэг', icon: '🌤' },
    2: { desc: 'Хагас үүлэрхэг', icon: '⛅' },
    3: { desc: 'Үүлэрхэг', icon: '☁️' },
    45: { desc: 'Манантай', icon: '🌫️' },
    61: { desc: 'Бага зэргийн бороо', icon: '🌧️' },
    63: { desc: 'Бороотой', icon: '🌧️' },
    71: { desc: 'Бага зэргийн цас', icon: '🌨️' },
    95: { desc: 'Аянгатай бороо', icon: '⛈️' }
};

// 2. Loading анимейшн харуулах
function showLoading() {
    // Өмнөх loader байгаа эсэхийг шалгаад байвал устгах
    removeLoader();
    resultSection.insertAdjacentHTML('afterbegin', '<div id="loader" class="loading" style="text-align: center; padding: 20px;">Уншиж байна...</div>');
}

// Loader-ийг аюулгүй устгах функц (Таны алдааг засах гол хэсэг)
function removeLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.remove();
    }
}

// 8. Алдаа барих функц
function showError(msg) {
    alert(`Алдаа: ${msg}`);
    removeLoader(); // Алдаа гарсан үед loader-ийг заавал устгана
}

// Үндсэн Fetch функц
async function fetchWeatherData(cityName) {
    try {
        // 1. Хоосон утга шалгах
        if (!cityName) {
            showError("Хотын нэр оруулна уу!");
            return;
        }

        showLoading();

        // Алхам 1: Геокод авах (Хотын координатыг олох)
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`);
        const geoData = await geoRes.json();

        // 8. Буруу хотын нэр шалгах
        if (!geoData.results || geoData.results.length === 0) {
            throw new Error(`"${cityName}" нэртэй хот олдсонгүй.`);
        }

        const loc = geoData.results[0];

        // 4. Нэмэлт мэдээлэл татах (Даралт, Үзэгдэх орчин)
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m,relative_humidity_2m,surface_pressure,visibility,wind_speed_10m,weather_code&temperature_unit=celsius`;

        const weatherRes = await fetch(weatherUrl);
        if (!weatherRes.ok) throw new Error("Цаг агаарын сервер хариу өгсөнгүй.");

        const wData = await weatherRes.json();

        // Өгөгдлийг дэлгэцэнд харуулах
        renderWeatherCard(loc.name, loc.country, wData.current);

        // 5. LocalStorage хадгалах
        localStorage.setItem('lastCity', loc.name);
        if (lastSearchedSpan) lastSearchedSpan.textContent = loc.name;

        // Амжилттай болсон тул loader-ийг устгах
        removeLoader();

    } catch (err) {
        showError(err.message);
    }
}

// 7. Олон хотын мэдээллийг жагсааж харуулах
function renderWeatherCard(name, country, data) {
    const info = weatherInfo[data.weather_code] || { desc: 'Тодорхойгүй', icon: '🌈' };

    const cardHtml = `
        <div class="weather-card" style="background: var(--glass-bg); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid var(--glass-border); border-radius: 24px; padding: 25px; box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2); animation: slideUp 0.6s ease; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h2 style="margin: 0;">${info.icon} ${name}, ${country || ''}</h2>
                    <p style="color: #666; margin: 5px 0;">${info.desc}</p>
                </div>
                <div style="font-size: 2.5rem; font-weight: bold;">${Math.round(data.temperature_2m)}°C</div>
            </div>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 15px; border-top: 1px solid #ddd; padding-top: 10px;">
                <div><small>Чийгшил:</small> <strong>${data.relative_humidity_2m}%</strong></div>
                <div><small>Салхи:</small> <strong>${data.wind_speed_10m} м/с</strong></div>
                <div><small>Даралт:</small> <strong>${Math.round(data.surface_pressure)} hPa</strong></div>
                <div><small>Үзэгдэх орчин:</small> <strong>${(data.visibility / 1000).toFixed(1)} км</strong></div>
            </div>
        </div>
    `;

    // Эхний хайлт бол placeholder-ийг устгана
    const placeholder = resultSection.querySelector('.placeholder');
    if (placeholder) {
        resultSection.innerHTML = '';
    }

    // Шинэ картыг хамгийн дээр нь нэмнэ
    resultSection.insertAdjacentHTML('afterbegin', cardHtml);
}

// 6. Clear товчлуур
if (clearBtn) {
    clearBtn.addEventListener('click', () => {
        resultSection.innerHTML = '<div class="placeholder" style="text-align: center; color: #999; padding: 20px;">Хотын нэр оруулж хайлт хийнэ үү.</div>';
        cityInput.value = '';
        cityInput.focus();
    });
}

// 3. Өөр API (JSONPlaceholder) ашиглах тест
if (testApiBtn) {
    testApiBtn.addEventListener('click', async () => {
        try {
            const res = await fetch('https://jsonplaceholder.typicode.com/posts/1');
            const data = await res.json();
            const testDiv = document.getElementById('apiTestResult');
            if (testDiv) {
                testDiv.innerHTML = `<p style="color: blue; font-size: 0.9rem; margin-top: 10px;">API Test: ${data.title}</p>`;
            }
        } catch (e) {
            console.error("Test API Error");
        }
    });
}

// Event Listeners
fetchBtn.addEventListener('click', () => {
    fetchWeatherData(cityInput.value.trim());
    cityInput.value = '';
});

if (cityInput) {
    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            fetchBtn.click();
        }
    });
}