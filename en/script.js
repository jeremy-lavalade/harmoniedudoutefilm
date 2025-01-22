//SCRIPT POUR INTEGRER HEADER & FOOTER
  document.addEventListener('DOMContentLoaded', function() {
    fetch('header-footer/header.html')
      .then(response => response.text())
      .then(data => {
          document.getElementById('header').innerHTML = data;
      });

    fetch('header-footer/footer.html')
      .then(response => response.text())
      .then(data => {
          document.getElementById('footer').innerHTML = data;
      });
  });

  window.onload = function() {
    function updateImageSource() {
        const screenWidth = window.innerWidth;
        const image = document.getElementById('header-doute');
        if (screenWidth < 380) {
            image.src = "images/logo-hdd/doute-logo.webp";
        } else if (screenWidth >= 1024 && screenWidth <= 1049) {
            image.src = "images/logo-hdd/doute-logo.webp";
        } else {
            image.src = "images/logo-hdd/doute.webp";
        }
    }
    updateImageSource(); 
    window.addEventListener('resize', updateImageSource); 
  };

//SCRIPT POUR MODIFICATION COULEUR HEADER SELON SCROLL
  window.onscroll = function() {
      var header = document.getElementById('header');
      if (window.scrollY > 90) {
          header.style.backgroundColor = '#343737'; // Couleur après avoir défilé de 90px
      } else {
          header.style.backgroundColor = 'transparent'; // Transparent au début
      }
  };
//SCRIPT POUR HEADER EN FORMAT MOBILE
  function toggleMenuHeader(icon) {
    var menuheader = document.getElementById('header-menu'); // Obtenez l'élément de menu par son identifiant
    
    // Vérifie si le menu est déjà affiché
    if (menuheader.style.display === 'flex') {
      menuheader.style.display = 'none'; // Cachez le menu
      icon.classList.remove('open'); // Retirez la classe 'open' car le menu est caché

    } else {
      menuheader.style.display = 'flex'; // Affichez le menu
      // Ajoutez la classe 'open' seulement si elle n'est pas déjà présente
      if (!icon.classList.contains('open')) {
        icon.classList.add('open');
      }
    }
  }
//SCRIPT POUR FOOTER EN FORMAT MOBILE
  function toggleMenuFooter(event, menuId) {
    event.preventDefault();
    event.stopPropagation();
    var menufooter = document.getElementById(menuId);
    var toggle = event.target;

    if (menufooter.style.display === 'block') {
      menufooter.style.display = 'none';
      toggle.textContent = '+';
    } else {
      menufooter.style.display = 'block';
      toggle.textContent = '−';
    }
  }
  