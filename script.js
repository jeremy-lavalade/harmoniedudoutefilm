/* =====================================================
   L'HARMONIE DU DOUTE — comportements du site
   Header verre, menu, apparitions, jauge de profondeur,
   titre animé (accueil), plongée dans la mer (PixiJS),
   lecteur vidéo YouTube différé.
   ===================================================== */

(function () {
  'use strict';

  // Racine des assets (la version anglaise vit dans en/)
  var RACINE = document.documentElement.lang === 'en' ? '../' : '';
  var reduireMouvement = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var estAccueil = document.body.classList.contains('accueil');

  /* ---------- HEADER : verre dépoli au scroll ---------- */
  var entete = document.getElementById('entete');
  function majEntete() {
    if (entete) entete.classList.toggle('scrolled', window.scrollY > 40);
  }

  /* ---------- MENU MOBILE ---------- */
  var burger = document.getElementById('burger');
  var menuMobile = document.getElementById('menu-mobile');
  if (burger && menuMobile) {
    var basculerMenu = function (forcerFermeture) {
      var ouvert = forcerFermeture === true ? false : !menuMobile.classList.contains('ouvert');
      menuMobile.classList.toggle('ouvert', ouvert);
      burger.classList.toggle('ouvert', ouvert);
      burger.setAttribute('aria-expanded', ouvert ? 'true' : 'false');
      burger.setAttribute('aria-label', ouvert ? 'Fermer le menu' : 'Ouvrir le menu');
      document.body.style.overflow = ouvert ? 'hidden' : '';
    };
    burger.addEventListener('click', function () { basculerMenu(); });
    menuMobile.querySelectorAll('a').forEach(function (lien) {
      lien.addEventListener('click', function () { basculerMenu(true); });
    });
    var fermerMenu = document.getElementById('menu-fermer');
    if (fermerMenu) fermerMenu.addEventListener('click', function () { basculerMenu(true); });
  }

  /* ---------- BARRE DE PROGRESSION DE LECTURE (pages récit) ---------- */
  var progressionLecture = document.getElementById('progression-lecture');
  function majProgression() {
    if (!progressionLecture) return;
    var course = document.documentElement.scrollHeight - window.innerHeight;
    var p = course > 0 ? Math.min(Math.max(window.scrollY / course, 0), 1) : 0;
    progressionLecture.style.transform = 'scaleX(' + p.toFixed(4) + ')';
  }

  /* ---------- APPARITIONS AU SCROLL ---------- */
  var elementsReveal = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduireMouvement) {
    /* Deux seuils : 0.15 pour l'esthétique, 0 pour les éléments plus hauts
       que l'écran (une galerie d'une colonne sur mobile ne peut jamais être
       visible à 15 % : elle resterait invisible à jamais). */
    var observateur = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (entree) {
        var grand = entree.boundingClientRect.height > window.innerHeight * 0.6;
        if (entree.isIntersecting && (grand || entree.intersectionRatio >= 0.15)) {
          entree.target.classList.add('visible');
          observateur.unobserve(entree.target);
        }
      });
    }, { threshold: [0, 0.15], rootMargin: '0px 0px -5% 0px' });
    elementsReveal.forEach(function (el) { observateur.observe(el); });
  } else {
    elementsReveal.forEach(function (el) { el.classList.add('visible'); });
  }

  /* ---------- LECTEUR YOUTUBE DIFFÉRÉ ---------- */
  document.querySelectorAll('.video-cadre[data-video]').forEach(function (cadre) {
    var bouton = cadre.querySelector('.video-play');
    if (!bouton) return;
    bouton.addEventListener('click', function () {
      var id = cadre.dataset.video;
      var iframe = document.createElement('iframe');
      iframe.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0';
      iframe.title = cadre.dataset.titre || 'Vidéo';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.allowFullscreen = true;
      cadre.innerHTML = '';
      cadre.appendChild(iframe);
      // La musique d'ambiance laisse la place à la vidéo
      document.dispatchEvent(new CustomEvent('hdd:video'));
    });
  });

  /* ---------- GALERIE DE LA SOIRÉE ----------
     Déposer les photos dans images/soiree/ en les nommant
     photo-01.webp (ou .jpg/.jpeg/.png), photo-02…, photo-03… :
     la galerie les affiche dans l'ordre et s'arrête d'elle-même
     après deux numéros consécutifs absents. Un clic ouvre la
     visionneuse (modale) qui permet de défiler photo par photo. */
  var galerieSoiree = document.getElementById('galerie-soiree');
  if (galerieSoiree) {
    var enAnglais = document.documentElement.lang === 'en';
    var dossierPhotos = galerieSoiree.dataset.dossier || (RACINE + 'images/soiree/');
    var noteGalerie = document.getElementById('galerie-note');
    var photosGalerie = [];

    /* La visionneuse */
    var visionneuse = document.createElement('div');
    visionneuse.id = 'visionneuse';
    visionneuse.setAttribute('role', 'dialog');
    visionneuse.setAttribute('aria-modal', 'true');
    visionneuse.setAttribute('aria-label', enAnglais ? 'Photo viewer' : 'Visionneuse de photos');
    visionneuse.innerHTML =
      '<img alt="">' +
      '<button class="visionneuse-btn visionneuse-fermer" aria-label="' + (enAnglais ? 'Close' : 'Fermer') + '">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
      '<button class="visionneuse-btn visionneuse-prec" aria-label="' + (enAnglais ? 'Previous photo' : 'Photo précédente') + '">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M14.5 5.5L8 12l6.5 6.5"/></svg></button>' +
      '<button class="visionneuse-btn visionneuse-suiv" aria-label="' + (enAnglais ? 'Next photo' : 'Photo suivante') + '">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M9.5 5.5L16 12l-6.5 6.5"/></svg></button>' +
      '<span class="visionneuse-compteur" aria-live="polite"></span>';
    document.body.appendChild(visionneuse);

    var visionneuseImg = visionneuse.querySelector('img');
    var visionneuseCompteur = visionneuse.querySelector('.visionneuse-compteur');
    var photoCourante = 0;

    var afficherPhoto = function (index) {
      photoCourante = (index + photosGalerie.length) % photosGalerie.length;
      visionneuseImg.src = photosGalerie[photoCourante];
      visionneuseImg.alt = (enAnglais ? 'Screening night photo ' : 'Photo de la soirée de projection ') + (photoCourante + 1);
      visionneuseCompteur.textContent = (photoCourante + 1) + ' / ' + photosGalerie.length;
      // précharge les voisines pour un défilement fluide
      [photoCourante + 1, photoCourante - 1].forEach(function (v) {
        var pre = new Image();
        pre.src = photosGalerie[(v + photosGalerie.length) % photosGalerie.length];
      });
    };

    var ouvrirVisionneuse = function (index) {
      afficherPhoto(index);
      visionneuse.classList.add('ouverte');
      document.body.style.overflow = 'hidden';
      visionneuse.querySelector('.visionneuse-fermer').focus();
    };

    var fermerVisionneuse = function () {
      visionneuse.classList.remove('ouverte');
      document.body.style.overflow = '';
    };

    visionneuse.querySelector('.visionneuse-fermer').addEventListener('click', fermerVisionneuse);
    visionneuse.querySelector('.visionneuse-prec').addEventListener('click', function () { afficherPhoto(photoCourante - 1); });
    visionneuse.querySelector('.visionneuse-suiv').addEventListener('click', function () { afficherPhoto(photoCourante + 1); });
    visionneuse.addEventListener('click', function (e) { if (e.target === visionneuse) fermerVisionneuse(); });

    document.addEventListener('keydown', function (e) {
      if (!visionneuse.classList.contains('ouverte')) return;
      if (e.key === 'Escape') fermerVisionneuse();
      else if (e.key === 'ArrowLeft') afficherPhoto(photoCourante - 1);
      else if (e.key === 'ArrowRight') afficherPhoto(photoCourante + 1);
    });

    // Balayage tactile
    var toucheDepartX = null;
    visionneuse.addEventListener('touchstart', function (e) { toucheDepartX = e.changedTouches[0].clientX; }, { passive: true });
    visionneuse.addEventListener('touchend', function (e) {
      if (toucheDepartX === null) return;
      var delta = e.changedTouches[0].clientX - toucheDepartX;
      if (Math.abs(delta) > 45) afficherPhoto(photoCourante + (delta < 0 ? 1 : -1));
      toucheDepartX = null;
    }, { passive: true });

    /* Le chargement des vignettes */
    var chargerPhoto = function (numero, absentes) {
      if (numero > 60 || absentes >= 2) {
        if (noteGalerie && photosGalerie.length === 0) noteGalerie.hidden = false;
        return;
      }
      var nom = 'photo-' + (numero < 10 ? '0' + numero : numero);
      var extensions = ['.webp', '.jpg', '.jpeg', '.png'];
      var essayer = function (i) {
        if (i >= extensions.length) { chargerPhoto(numero + 1, absentes + 1); return; }
        var img = new Image();
        img.onload = function () {
          var indexPhoto = photosGalerie.length;
          photosGalerie.push(img.src);
          img.alt = (enAnglais ? 'Screening night photo ' : 'Photo de la soirée de projection ') + numero;
          img.loading = 'lazy';
          img.decoding = 'async';
          var bouton = document.createElement('button');
          bouton.type = 'button';
          bouton.setAttribute('aria-label', (enAnglais ? 'View photo ' : 'Voir la photo ') + numero + (enAnglais ? ' full screen' : ' en grand'));
          bouton.appendChild(img);
          bouton.addEventListener('click', function () { ouvrirVisionneuse(indexPhoto); });
          galerieSoiree.appendChild(bouton);
          chargerPhoto(numero + 1, 0);
        };
        img.onerror = function () { essayer(i + 1); };
        img.src = dossierPhotos + nom + extensions[i];
      };
      essayer(0);
    };
    chargerPhoto(1, 0);
  }

  /* ---------- MUSIQUE D'AMBIANCE (accueil) ----------
     Lecture automatique à l'ouverture et au rechargement. Les navigateurs
     bloquent l'autoplay sonore tant que l'utilisateur n'a pas interagi :
     dans ce cas, la musique démarre au premier geste. Le bouton en bas à
     gauche est la seule autorité : pas de fondu de volume (iOS le verrouille,
     et un volume à zéro donne une « lecture » silencieuse) — on joue au
     volume cible et on coupe net avec pause(). L'état affiché par le bouton
     suit les événements réels play/pause de l'élément audio. */
  var ambiance = document.getElementById('ambiance');
  var boutonSon = document.getElementById('son');
  if (ambiance && boutonSon) {
    var VOLUME_AMBIANCE = 0.4;
    // Pas de lancement automatique : la musique ne démarre seule que si
    // l'utilisateur l'avait explicitement activée lors d'une visite précédente
    var musiqueActiveMemorisee = false;
    try { musiqueActiveMemorisee = localStorage.getItem('hdd-musique') === 'active'; } catch (e) {}

    var majBoutonSon = function (actif) {
      boutonSon.classList.toggle('muet', !actif);
      boutonSon.setAttribute('aria-pressed', actif ? 'true' : 'false');
      boutonSon.setAttribute('aria-label', actif ? "Couper la musique d'ambiance" : "Activer la musique d'ambiance");
    };

    // Le bouton reflète TOUJOURS l'état réel de l'audio (y compris une
    // pause déclenchée par le système : écran verrouillé, autre média…)
    ambiance.addEventListener('play', function () { majBoutonSon(true); });
    ambiance.addEventListener('playing', function () { majBoutonSon(true); });
    ambiance.addEventListener('pause', function () { majBoutonSon(false); });

    /* Safari (mac et iOS) n'accorde le droit de jouer un son qu'aux
       « vrais » gestes utilisateur : click, touchend, mousedown, keydown.
       scroll et wheel n'en font pas partie — on écoute donc les deux familles. */
    var GESTES = ['pointerdown', 'mousedown', 'click', 'keydown', 'touchend', 'touchstart', 'wheel', 'scroll'];
    var retirerDeclencheurs = function () {
      GESTES.forEach(function (evt) {
        window.removeEventListener(evt, demarrerAuGeste);
      });
    };

    var jouerAmbiance = function () {
      ambiance.muted = false;
      try { ambiance.volume = VOLUME_AMBIANCE; } catch (e) { /* iOS : volume géré par le matériel */ }
      var promesse = ambiance.play();
      if (promesse && promesse.then) {
        promesse.then(function () {
          retirerDeclencheurs();
        }).catch(function () { /* autoplay bloqué : on attend un geste */ });
      }
    };

    var couperAmbiance = function () {
      retirerDeclencheurs();
      ambiance.pause(); // coupure immédiate, fiable sur tous les appareils
    };

    var demarrerAuGeste = function (e) {
      if (e && e.target && e.target.nodeType === 1) {
        if (boutonSon.contains(e.target)) return; // le bouton décide lui-même
        if (e.target.closest && e.target.closest('.video-cadre')) return; // lancer une vidéo ne démarre pas la musique
      }
      jouerAmbiance();
    };

    boutonSon.addEventListener('click', function () {
      // L'état réel de l'audio fait foi, pas l'apparence du bouton
      if (ambiance.paused) {
        try { localStorage.setItem('hdd-musique', 'active'); } catch (err) {}
        jouerAmbiance();
      } else {
        try { localStorage.setItem('hdd-musique', 'coupee'); } catch (err) {}
        couperAmbiance();
      }
    });

    // La musique est-elle explicitement souhaitée ?
    var musiqueVoulue = function () {
      try { return localStorage.getItem('hdd-musique') === 'active'; } catch (e) { return false; }
    };
    var videoEnCours = false;

    // Nouvelle tentative automatique tant que le navigateur bloque l'autoplay
    // (il l'autorise souvent après une première interaction avec le site)
    var relancerSiVoulue = function () {
      if (ambiance.paused && musiqueVoulue() && !videoEnCours) jouerAmbiance();
    };

    if (musiqueActiveMemorisee) {
      // Reprise du choix mémorisé : tentative immédiate,
      // puis repli sur le premier geste de l'utilisateur
      jouerAmbiance();
      GESTES.forEach(function (evt) {
        window.addEventListener(evt, demarrerAuGeste, { passive: true, once: false });
      });
    }
    // ... et retentatives aux moments clés : fin du chargement, retour sur la
    // page via le bouton précédent (bfcache), retour sur l'onglet
    window.addEventListener('load', relancerSiVoulue);
    window.addEventListener('pageshow', function (e) { if (e.persisted) relancerSiVoulue(); });
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) relancerSiVoulue();
    });

    // Une vidéo démarre : la musique s'efface (sans mémoriser le choix)
    document.addEventListener('hdd:video', function () {
      videoEnCours = true;
      if (!ambiance.paused) couperAmbiance();
      else retirerDeclencheurs();
    });

    /* Invitation à découvrir la musique : apparaît après un court délai
       si la musique ne joue pas, disparaît quand on descend dans la page
       et RÉAPPARAÎT quand on remonte tout en haut. Elle s'éteint pour de
       bon dès que la musique démarre ou que le bouton est utilisé. */
    var noteSon = document.getElementById('son-note');
    if (noteSon) {
      var noteEteinte = false;
      var notePrete = false;
      var majNote = function () {
        var montrer = !noteEteinte && notePrete && ambiance.paused && window.scrollY <= 30;
        noteSon.classList.toggle('visible', montrer);
        noteSon.classList.toggle('cachee', !montrer);
      };
      var eteindreNote = function () {
        noteEteinte = true;
        majNote();
      };
      setTimeout(function () { notePrete = true; majNote(); }, 900);
      window.addEventListener('scroll', majNote, { passive: true });
      ambiance.addEventListener('playing', eteindreNote);
      boutonSon.addEventListener('click', eteindreNote);
    }
  }

  /* =====================================================
     ACCUEIL UNIQUEMENT
     ===================================================== */

  /* ---------- TITRE ANIMÉ : du centre de page vers le header ---------- */
  var titreAnime = document.getElementById('titre-anime');
  var titreEspace = document.getElementById('titre-espace');
  var titreGeo = null;

  function mesurerTitre() {
    if (!titreAnime || !titreEspace) return;
    // Largeur de départ : celle du gabarit dans le hero
    var largeurA = titreEspace.getBoundingClientRect().width;
    titreAnime.style.width = largeurA + 'px';
    var wordmark = titreAnime.querySelector('.wordmark');
    if (wordmark) {
      wordmark.style.fontSize = '100px';
      var brut = wordmark.scrollWidth || 1;
      wordmark.style.fontSize = (100 * largeurA / brut).toFixed(2) + 'px';
    }
    // Arrivée : exactement sur le wordmark (invisible) du header.
    // On mesure sa position réelle plutôt que de la recalculer : l'atterrissage
    // est ainsi identique au header statique, sur tous les navigateurs (Safari compris).
    var xb, yb = null, largeurB;
    var texteEntete = document.querySelector('.entete-logo-texte');
    var ligneEntete = texteEntete ? texteEntete.querySelector(':scope > img') : null;
    if (ligneEntete && ligneEntete.getBoundingClientRect().width > 0) {
      var rLigne = ligneEntete.getBoundingClientRect();
      xb = rLigne.left;
      yb = rLigne.top;
      largeurB = rLigne.width;
    } else {
      // Repli si le header ne contient pas d'images : heuristique d'origine
      var icone = document.querySelector('.entete-logo-icone');
      var rIcone = icone.getBoundingClientRect();
      xb = rIcone.right + 10;
      largeurB = Math.min(150, window.innerWidth * 0.32);
    }
    // L'échelle rapporte la PREMIÈRE LIGNE animée à la première ligne du header
    // (en anglais, « HARMONY » est plus étroite que le conteneur).
    var ligneAnimee = titreAnime.querySelector(':scope > img');
    var largeurLigneA = (ligneAnimee && ligneAnimee.offsetWidth) || largeurA;
    var echelle = largeurB / largeurLigneA;

    // L'interligne du hero, une fois réduit à l'échelle du header, doit valoir les 3 px du wordmark
    if (titreAnime.querySelector('.titre-doute')) {
      titreAnime.style.gap = Math.min(Math.max(3 / echelle, 4), 30).toFixed(2) + 'px';
    }

    var hauteurA = titreAnime.offsetHeight; // hors transform (fiable même re-mesuré en cours de scroll)
    titreEspace.style.height = hauteurA + 'px';

    var rectEspace = titreEspace.getBoundingClientRect();
    var xa = rectEspace.left;
    var ya = rectEspace.top + window.scrollY; // position absolue de départ

    if (yb === null) yb = Math.max((64 - hauteurA * echelle) / 2, 6);

    titreGeo = { xa: xa, ya: ya, xb: xb, yb: yb, echelle: echelle };
    majTitre();
    titreAnime.classList.add('pret'); // mesuré et posé : on peut l'afficher
  }

  function majTitre() {
    if (!titreGeo || !titreAnime) return;
    var course = Math.max(window.innerHeight * 0.55, 260);
    var p = Math.min(Math.max(window.scrollY / course, 0), 1);
    var pe = 1 - Math.pow(1 - p, 3); // easeOutCubic

    var x = titreGeo.xa + (titreGeo.xb - titreGeo.xa) * pe;
    var yDepart = titreGeo.ya - window.scrollY; // suit le flux tant que p < 1
    var y = yDepart + (titreGeo.yb - yDepart) * pe;
    var s = 1 + (titreGeo.echelle - 1) * pe;

    titreAnime.style.transform = 'translate(' + x.toFixed(1) + 'px, ' + y.toFixed(1) + 'px) scale(' + s.toFixed(4) + ')';

    // Lignes centrées dans le hero -> justifiées à gauche en rejoignant le header
    // (data-centre = marge de centrage en %), pendant que le O-arches s'efface
    // au profit du O normal (toujours rose).
    titreAnime.querySelectorAll('[data-centre]').forEach(function (ligne) {
      ligne.style.marginLeft = (parseFloat(ligne.dataset.centre) * (1 - pe)).toFixed(3) + '%';
    });
    var douteBloc = titreAnime.querySelector('.titre-doute');
    if (douteBloc) {
      var fonduO = Math.min(Math.max((p - 0.55) / 0.45, 0), 1);
      var archesImg = douteBloc.querySelector('.doute-arches');
      var simpleImg = douteBloc.querySelector('.doute-simple');
      if (archesImg) archesImg.style.opacity = (1 - fonduO).toFixed(3);
      if (simpleImg) simpleImg.style.opacity = fonduO.toFixed(3);
    }

    // Le sous-titre « Le Film » et les ornements du hero s'effacent en montant
    var fondu = Math.max(1 - p * 1.9, 0);
    var lefilm = titreAnime.querySelector('.titre-lefilm');
    if (lefilm) lefilm.style.opacity = fondu;
    ['.ciel-presente', '.ciel-tagline', '.ciel-actions', '.indicateur-scroll'].forEach(function (sel) {
      var el = document.querySelector(sel);
      if (el) el.style.opacity = fondu;
    });
    var actions = document.querySelector('.ciel-actions');
    if (actions) actions.style.pointerEvents = p > 0.4 ? 'none' : '';
  }

  if (titreAnime && titreEspace && !reduireMouvement) {
    // Mesure au plus tôt : dès que les images du titre sont décodées
    // (sans attendre le chargement complet de la page), puis re-mesures
    // au load (polices, mises en page tardives) et au redimensionnement.
    var imagesTitre = Array.prototype.slice.call(titreAnime.querySelectorAll('img'));
    if (imagesTitre.length && imagesTitre[0].decode) {
      Promise.all(imagesTitre.map(function (im) {
        return im.decode().catch(function () {});
      })).then(mesurerTitre);
    }
    window.addEventListener('load', mesurerTitre);
    // iOS émet des resize pendant le scroll (barre d'adresse) :
    // on ne remesure que si la LARGEUR change vraiment
    var largeurMesuree = window.innerWidth;
    window.addEventListener('resize', function () {
      if (window.innerWidth !== largeurMesuree) {
        largeurMesuree = window.innerWidth;
        mesurerTitre();
      }
    });
    if (document.readyState === 'complete') mesurerTitre();
  } else if (titreAnime && titreEspace) {
    // Mouvement réduit : titre statique dans le hero, wordmark du header visible
    window.addEventListener('load', function () {
      var largeurA = titreEspace.getBoundingClientRect().width;
      titreAnime.style.width = largeurA + 'px';
      titreAnime.style.position = 'absolute';
      var r = titreEspace.getBoundingClientRect();
      titreAnime.style.transform = 'translate(' + r.left + 'px, ' + (r.top + window.scrollY) + 'px)';
      titreEspace.style.height = titreAnime.getBoundingClientRect().height + 'px';
      document.body.classList.remove('accueil'); // réaffiche le wordmark du header
      titreAnime.parentElement.style.position = 'relative';
      titreAnime.classList.add('pret');
    });
  }

  /* ---------- LA PLONGÉE : la mer s'écrase, on passe dessous ---------- */
  var plongee = document.getElementById('plongee');
  var plongeeCanvas = document.getElementById('plongee-canvas');
  var plongeeTexte = document.getElementById('plongee-texte');
  var merApp, merImage, merDeplacement;
  var HAUTEUR_MINI = 54;

  /* Repli : image fixe et page qui reste parfaitement défilable
     (mouvement réduit, PixiJS absent, WebGL indisponible ou perdu) */
  function merStatique() {
    if (merApp) {
      try { merApp.destroy(true, { children: true, texture: true, baseTexture: true }); } catch (e) {}
      merApp = null;
    }
    plongeeCanvas.innerHTML = '';
    plongeeCanvas.style.background = "url('" + RACINE + "images/accueil/mer.webp') center / cover no-repeat";
    plongeeCanvas.style.filter = 'saturate(0.55) brightness(0.6) hue-rotate(-12deg)';
    document.body.classList.add('mer-statique'); // annule le chevauchement des profondeurs
    if (plongee) plongee.style.height = '100vh'; // plus d'épinglage : rien ne retient le défilement
    if (plongeeTexte) {
      plongeeTexte.style.top = '58%';
      plongeeTexte.classList.add('visible');
    }
  }

  function initialiserMer() {
    if (!plongeeCanvas) return;

    if (reduireMouvement || typeof PIXI === 'undefined') {
      merStatique();
      return;
    }

    try {
      var l = Math.max(window.innerWidth, 1);
      var h = Math.max(window.innerHeight, 1);
      merApp = new PIXI.Application({ width: l, height: h, transparent: true });

      // Le canvas ne doit JAMAIS intercepter le tactile : PixiJS pose
      // touch-action:none par défaut, ce qui fige le défilement sur mobile
      // tant que le doigt part de la mer (section plein écran !)
      merApp.view.style.pointerEvents = 'none';
      merApp.view.style.touchAction = 'auto';
      if (merApp.renderer.plugins && merApp.renderer.plugins.interaction) {
        merApp.renderer.plugins.interaction.autoPreventDefault = false;
      }
      plongeeCanvas.appendChild(merApp.view);

      merImage = PIXI.Sprite.from(RACINE + 'images/accueil/mer.webp');
      merImage.width = l;
      merImage.height = h;
      merImage.tint = 0x8093C8; // accorde la mer turquoise à la nuit de l'affiche
      merApp.stage.addChild(merImage);

      // Carte de déplacement en 512x512 : une puissance de deux est requise
      // par le mode MIRRORED_REPEAT sur WebGL1 (Safari et mobiles plus anciens),
      // sans quoi la mer s'affiche figée et délavée
      merDeplacement = PIXI.Sprite.from(RACINE + 'images/accueil/displacement-map-512.png');
      merDeplacement.texture.baseTexture.wrapMode = PIXI.WRAP_MODES.MIRRORED_REPEAT;
      merDeplacement.width = l * 1.2;
      merDeplacement.height = h;
      merApp.stage.addChild(merDeplacement);

      merApp.stage.filters = [new PIXI.filters.DisplacementFilter(merDeplacement)];

      merApp.ticker.add(function (delta) {
        // La vitesse suit la hauteur de la carte : le mouvement des vagues
        // est ainsi identique que la mer soit plein écran ou écrasée
        // (0,07 px/image sur une carte plein écran était imperceptible).
        merDeplacement.y += merDeplacement.height * 0.0013 * (delta || 1);
      });

      // Contexte WebGL perdu (GPU saturé, onglet longtemps caché…) :
      // on bascule sur l'image fixe plutôt qu'un rectangle noir
      merApp.view.addEventListener('webglcontextlost', function (e) {
        e.preventDefault();
        merStatique();
      });
    } catch (e) {
      merStatique();
      return;
    }

    ajusterPlongee();
  }

  function ajusterPlongee() {
    if (!merApp || !plongee) return;
    var vh = window.innerHeight;
    var largeur = Math.max(window.innerWidth, 1);

    // Redimensionner le rendu WebGL est coûteux : uniquement quand la
    // fenêtre change vraiment (jamais à chaque cran de scroll)
    if (merApp.renderer.width !== largeur || merApp.renderer.height !== vh) {
      merApp.renderer.resize(largeur, vh);
      merImage.width = largeur;
      merDeplacement.width = largeur * 1.2;
    }

    var rect = plongee.getBoundingClientRect();
    var course = rect.height - vh;

    // Progression : 0 quand la section touche le haut de l'écran, 1 en fin de course
    var p = course > 0 ? Math.min(Math.max(-rect.top / course, 0), 1) : 0;

    // L'image s'écrase : pleine hauteur -> mince pellicule (la surface passe
    // au-dessus de nous). Seule la hauteur du sprite change : le canvas,
    // transparent, laisse voir le fond nuit en dessous.
    var hauteur = Math.round(vh + (HAUTEUR_MINI - vh) * p);
    merImage.height = hauteur;
    merDeplacement.height = Math.max(hauteur, 1);

    // Le texte apparaît une fois passé sous la surface
    if (plongeeTexte) {
      plongeeTexte.style.top = 'calc(' + hauteur + 'px + clamp(2rem, 8vh, 4rem))';
      plongeeTexte.classList.toggle('visible', p > 0.55);
    }
  }

  /* ---------- JAUGE DE PROFONDEUR : de 0 m (haut) à −100 m (bas de page) ---------- */
  var jaugeValeur = document.getElementById('jauge-valeur');
  var jaugeCurseur = document.getElementById('jauge-curseur');
  function majJauge() {
    if (!jaugeValeur || !jaugeCurseur) return;
    var course = document.documentElement.scrollHeight - window.innerHeight;
    var progression = course > 0 ? Math.min(Math.max(window.scrollY / course, 0), 1) : 0;
    var metres = Math.round(progression * 100);
    jaugeValeur.textContent = (metres === 0 ? '0' : '−' + metres) + ' m';
    jaugeCurseur.style.top = (progression * 100) + '%';
  }

  /* ---------- PARALLAXE DOUCE ---------- */
  var elementsParallaxe = document.querySelectorAll('[data-parallax]');
  function majParallaxe() {
    if (reduireMouvement) return;
    elementsParallaxe.forEach(function (el) {
      var vitesse = parseFloat(el.dataset.parallax) || 0.05;
      var rect = el.getBoundingClientRect();
      var decalage = (rect.top + rect.height / 2 - window.innerHeight / 2) * vitesse;
      el.style.transform = 'translateY(' + (-decalage).toFixed(1) + 'px)';
    });
  }

  /* ---------- BOUCLE SCROLL ----------
     Appels directs (comme le site d'origine) : les événements scroll
     sont déjà cadencés par frame, et cela reste fiable même quand
     requestAnimationFrame est suspendu. */
  function surScroll() {
    majEntete();
    majJauge();
    majProgression();
    majParallaxe();
    if (!reduireMouvement) {
      majTitre();
      ajusterPlongee();
    }
  }
  window.addEventListener('scroll', surScroll, { passive: true });
  window.addEventListener('resize', surScroll, { passive: true });

  /* ---------- INITIALISATION ---------- */
  window.addEventListener('load', function () {
    initialiserMer();
    majEntete();
    majJauge();
    majParallaxe();

    // Les images chargées après le saut d'ancre décalent la page :
    // on réaligne la cible une fois la mise en page stabilisée (deux passes).
    if (location.hash) {
      var realigner = function () {
        var cible = document.querySelector(location.hash);
        if (cible) cible.scrollIntoView({ behavior: 'auto', block: 'start' });
      };
      setTimeout(realigner, 300);
      setTimeout(realigner, 1000);
    }
  });
})();
