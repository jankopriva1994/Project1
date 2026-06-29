(function () {
  if (localStorage.getItem('cookie_consent') === '1') return;

  var banner = document.createElement('div');
  banner.className = 'cookie-banner';
  banner.innerHTML =
    '<p class="cookie-banner-text">Tento web používá soubory cookies pro zajištění správné funkčnosti, analytiku a zlepšení uživatelského zážitku. Používáním webu souhlasíte s jejich využitím. <a href="zasady-ochrany-osobnich-udaju.html">Více informací</a></p>' +
    '<button class="cookie-banner-accept">Rozumím</button>';

  document.body.appendChild(banner);

  banner.querySelector('.cookie-banner-accept').addEventListener('click', function () {
    localStorage.setItem('cookie_consent', '1');
    banner.style.display = 'none';
  });
})();
