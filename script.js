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

  /* ---------- ÉVÉNEMENTS GOATCOUNTER (aides communes) ---------- */
  var MESURE_ACTIVE = !/^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(location.hostname);
  function envoyerMesure(site, chemin, titre, campagne) {
    if (!MESURE_ACTIVE) return;
    var url = 'https://' + site + '.goatcounter.com/count?p=' + encodeURIComponent(chemin) +
      '&t=' + encodeURIComponent(titre) +
      (campagne ? '&q=' + encodeURIComponent('utm_campaign=' + campagne) : '') +
      '&rnd=' + Date.now();
    try {
      if (window.fetch) fetch(url, { keepalive: true, mode: 'no-cors' });
      else (new Image()).src = url;
    } catch (err) {}
  }
  // mémoire de la visite (sessionStorage : le temps d'un onglet, sans cookie)
  function seStocker(cle, valeur) { try { sessionStorage.setItem(cle, valeur); } catch (e) {} }
  function seLire(cle) { try { return sessionStorage.getItem(cle); } catch (e) { return null; } }
  function seRetirer(cle) { try { sessionStorage.removeItem(cle); } catch (e) {} }
  // nouvelle visite si aucune en cours, ou si la dernière date de plus de 4 h
  (function () {
    var debut = parseInt(seLire('hdd-v3-debut'), 10);
    if (!debut || Date.now() - debut > 4 * 3600 * 1000) {
      try {
        Object.keys(sessionStorage).forEach(function (cle) {
          if (cle.indexOf('hdd-v') === 0) sessionStorage.removeItem(cle);
        });
      } catch (e) {}
      seStocker('hdd-v3-debut', String(Date.now()));
    }
  })();

  /* ---------- DURÉE DE LA VISITE (paliers progressifs) ----------
     « ⏱ ouverture » part dès la première page, puis un palier à chaque
     seuil franchi tant que l'onglet reste ouvert — chacun une seule fois
     par visite, y compris à travers les navigations internes. Le panneau
     Campaigns se lit en entonnoir : % des visites encore ouvertes à 10 s,
     30 s, 1 min… Aucun envoi ne dépend de la fermeture de la page (fiable
     sur tous les navigateurs, Firefox compris). */
  (function () {
    var debut = parseInt(seLire('hdd-v3-debut'), 10) || Date.now();
    var SEUILS = [
      [0, 'ouverture'],
      [10, 'au moins 10s'],
      [30, 'au moins 30s'],
      [60, 'au moins 1min'],
      [120, 'au moins 2min'],
      [180, 'au moins 3min'],
      [240, 'au moins 4min'],
      [300, 'au moins 5min'],
      [600, 'au moins 10min'],
      [900, 'au moins 15min'],
      [1800, 'au moins 30min']
    ];
    SEUILS.forEach(function (seuil, i) {
      var cle = 'hdd-v3-duree-' + i;
      if (seLire(cle)) return;
      var envoyer = function () {
        if (seLire(cle)) return;
        seStocker(cle, '1');
        envoyerMesure('harmoniedudoute', '/duree-visite', 'Dur\u00e9e de la visite', '\u23f1 ' + seuil[1]);
      };
      var restant = seuil[0] * 1000 - (Date.now() - debut);
      if (restant <= 0) envoyer();
      else setTimeout(envoyer, restant);
    });
  })();

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

    /* Mesure musique :
       - Pages (une fois par visite) : /lancement-musique-manuelle OU
         /lancement-musique-automatique selon l'origine du premier lancement,
         et /arret-musique-manuelle à la première coupure au bouton.
       - Campaigns (portées par /duree-musique) : la tranche EXCLUSIVE de
         durée d'écoute cumulée — envoyée UNE seule fois par visite, à la
         première coupure au bouton ou au départ de la page (la musique
         s'arrête de toute façon avec la page). */
    var lancementParBouton = false;
    var mesureMusique = function (cle, chemin, titre, campagne) {
      if (seLire(cle)) return;
      seStocker(cle, '1');
      envoyerMesure('hdd-musique', chemin, titre, campagne);
    };

    var TRANCHES_MUSIQUE = [
      [10, '0 \u00e0 9 secondes'],
      [30, '10 \u00e0 29 secondes'],
      [60, '30 \u00e0 59 secondes'],
      [120, '1 \u00e0 1:59 min'],
      [180, '2 \u00e0 2:59 min'],
      [240, '3 \u00e0 3:59 min'],
      [300, '4 \u00e0 4:59 min'],
      [600, '5 \u00e0 9:59 min'],
      [Infinity, '10 min ou plus']
    ];
    var trancheMusique = function (secondes) {
      for (var i = 0; i < TRANCHES_MUSIQUE.length; i++) {
        if (secondes < TRANCHES_MUSIQUE[i][0]) return TRANCHES_MUSIQUE[i][1];
      }
      return TRANCHES_MUSIQUE[TRANCHES_MUSIQUE.length - 1][1];
    };

    var ecouteCumulee = parseInt(seLire('hdd-v3-m-cumul'), 10) || 0;
    var ecouteDepuis = null;

    var envoyerDureeMusique = function () {
      if (!seLire('hdd-v3-m-lancement') || seLire('hdd-v3-m-duree-ok')) return;
      seStocker('hdd-v3-m-duree-ok', '1');
      var total = ecouteCumulee + (ecouteDepuis !== null ? Date.now() - ecouteDepuis : 0);
      mesureMusique('hdd-v3-m-duree-hit', '/duree-musique', 'Dur\u00e9e de la musique',
        trancheMusique(total / 1000));
    };

    ambiance.addEventListener('playing', function () {
      if (ecouteDepuis === null) ecouteDepuis = Date.now();
      // premier lancement de la visite : manuel (bouton) ou automatique ?
      if (!seLire('hdd-v3-m-lancement')) {
        seStocker('hdd-v3-m-lancement', '1');
        if (lancementParBouton) {
          mesureMusique('hdd-v3-m-l-manuel', '/lancement-musique-manuelle', 'Lancement musique manuelle');
        } else {
          mesureMusique('hdd-v3-m-l-auto', '/lancement-musique-automatique', 'Lancement musique automatique');
        }
      }
    });
    ambiance.addEventListener('pause', function () {
      if (ecouteDepuis !== null) {
        ecouteCumulee += Date.now() - ecouteDepuis;
        ecouteDepuis = null;
        seStocker('hdd-v3-m-cumul', String(ecouteCumulee));
      }
    });
    // départ de la page (fermeture ou navigation) : la musique s'arrête,
    // on envoie la tranche de durée si ce n'est pas déjà fait
    window.addEventListener('pagehide', function () {
      if (ecouteDepuis !== null) {
        seStocker('hdd-v3-m-cumul', String(ecouteCumulee + (Date.now() - ecouteDepuis)));
      }
      envoyerDureeMusique();
    });
    // filet mobile : onglet masqué alors que la musique est déjà arrêtée
    // (l'application peut être fermée ensuite sans événement pagehide)
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden' && ambiance.paused) envoyerDureeMusique();
    });

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
        lancementParBouton = true;
        jouerAmbiance();
      } else {
        try { localStorage.setItem('hdd-musique', 'coupee'); } catch (err) {}
        mesureMusique('hdd-v3-m-arret', '/arret-musique-manuelle', 'Arr\u00eat musique manuelle (bouton)');
        envoyerDureeMusique();
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

    /* Invitation à découvrir la musique : visible tout en haut de la page
       tant que la musique ne joue pas — elle disparaît quand on descend
       ou quand la musique démarre, et réapparaît dès qu'on revient en haut. */
    var noteSon = document.getElementById('son-note');
    if (noteSon) {
      var notePrete = false;
      var majNote = function () {
        var montrer = notePrete && ambiance.paused && window.scrollY <= 30;
        noteSon.classList.toggle('visible', montrer);
        noteSon.classList.toggle('cachee', !montrer);
      };
      setTimeout(function () { notePrete = true; majNote(); }, 900);
      window.addEventListener('scroll', majNote, { passive: true });
      ambiance.addEventListener('playing', majNote);
      ambiance.addEventListener('pause', majNote);
      boutonSon.addEventListener('click', function () { setTimeout(majNote, 50); });
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
  var HAUTEUR_MINI = 0; // la mer s'écrase jusqu'à disparaître complètement
  var SOUS_ENTETE = 70; // la surface se cale sous le header fixe (64 px) pendant l'écrasement
  var RATIO_MER = 1500 / 744; // proportions natives de mer.webp

  // Mode « cover » : la photo garde ses proportions (recadrée et centrée
  // horizontalement) au lieu d'être étirée à l'écran — étirée en portrait,
  // les vagues devenaient étroites et verticales (effet « échographie »)
  function couvrirMer(largeur, vh) {
    var largeurMer = Math.max(largeur, vh * RATIO_MER);
    merImage.width = Math.round(largeurMer);
    merImage.x = Math.round((largeur - largeurMer) / 2);
  }

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
      merApp = new PIXI.Application({
        width: l,
        height: h,
        transparent: true,
        // rendu à la densité réelle de l'écran (Retina), plafonné à 2x :
        // sans cela l'image est calculée en pixels CSS puis agrandie -> pixelisée
        resolution: Math.min(window.devicePixelRatio || 1, 2),
        autoDensity: true
      });

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
      couvrirMer(l, h);
      merImage.height = h;
      merImage.tint = 0x8093C8; // accorde la mer turquoise à la nuit de l'affiche
      merApp.stage.addChild(merImage);

      /* Deux réglages distincts : sur mobile le mouvement doit rester
         perceptible pendant le défilement, mais sans exagération ;
         sur ordinateur on garde un frémissement plus fin. */
      var REGLAGES_MER = window.matchMedia('(pointer: coarse), (max-width: 760px)').matches
        ? { amplitude: 20, vitesseY: 0.32, vitesseX: 0.1 }
        : { amplitude: 22, vitesseY: 0.22, vitesseX: 0.08 };

      // Carte de déplacement : bruit de vaguelettes cyclique en 256x256
      // (puissance de deux : requise par MIRRORED_REPEAT sur WebGL1).
      // Elle reste en PERMANENCE à la taille de l'écran : c'est son
      // écrasement pendant le scroll qui déformait les vagues et rendait
      // le mouvement chaotique — seule l'image de la mer s'écrase.
      merDeplacement = PIXI.Sprite.from(RACINE + 'images/accueil/mer-vagues.png');
      merDeplacement.texture.baseTexture.wrapMode = PIXI.WRAP_MODES.MIRRORED_REPEAT;
      // Étirement horizontal minimum : sur un écran portrait (mobile), la
      // carte étirée telle quelle donne des motifs étroits et hauts — un
      // rendu « échographie ». On garantit des ondulations larges partout.
      merDeplacement.width = Math.max(l, h * 1.2);
      merDeplacement.height = h;
      merDeplacement.renderable = false; // sert uniquement au filtre : ne se dessine pas sur la mer
      merApp.stage.addChild(merDeplacement);

      var filtreMer = new PIXI.filters.DisplacementFilter(merDeplacement);
      filtreMer.scale.set(REGLAGES_MER.amplitude, REGLAGES_MER.amplitude * 0.7);
      merApp.stage.filters = [filtreMer];

      merApp.ticker.add(function (delta) {
        // Dérive lente en diagonale : les vaguelettes ondulent au lieu de
        // défiler — indépendante de l'écrasement, donc stable au scroll.
        var d = delta || 1;
        merDeplacement.y += REGLAGES_MER.vitesseY * d;
        merDeplacement.x += REGLAGES_MER.vitesseX * d;
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
    // renderer.screen est en pixels CSS (renderer.width est en pixels
    // physiques : avec la résolution Retina, le comparer à la fenêtre
    // relancerait un redimensionnement à chaque cran de scroll)
    if (merApp.renderer.screen.width !== largeur || merApp.renderer.screen.height !== vh) {
      merApp.renderer.resize(largeur, vh);
      couvrirMer(largeur, vh);
      // carte plein écran en toutes circonstances, ondulations toujours larges
      merDeplacement.width = Math.max(largeur, vh * 1.2);
      merDeplacement.height = vh;
    }

    var rect = plongee.getBoundingClientRect();
    var course = rect.height - vh;

    // L'écrasement démarre AVANT l'épinglage — dès que le haut de la mer
    // passe sous ~35 % de l'écran — pour que l'effet soit déjà en route
    // quand la surface approche du header.
    var avance = vh * 0.35;
    var p = Math.min(Math.max((avance - rect.top) / (course + avance), 0), 1);

    // La surface ne passe JAMAIS derrière le header : dès que le haut de la
    // section l'atteint, le haut de la mer se cale sous lui (SOUS_ENTETE)
    // et y reste pendant tout l'écrasement.
    merImage.y = Math.round(Math.min(Math.max(SOUS_ENTETE - Math.max(rect.top, 0), 0), SOUS_ENTETE));

    // L'image s'écrase : pleine hauteur -> disparition complète (la surface
    // passe au-dessus de nous). Seule l'IMAGE s'écrase — la carte de
    // déplacement, plein écran, n'est jamais déformée : le mouvement des
    // vagues reste stable et identique pendant tout le défilement.
    var hauteur = Math.round(vh + (HAUTEUR_MINI - vh) * p);
    merImage.height = hauteur;

    // Le texte apparaît une fois passé sous la surface
    if (plongeeTexte) {
      plongeeTexte.style.top = 'calc(' + (merImage.y + hauteur) + 'px + clamp(2rem, 8vh, 4rem))';
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
