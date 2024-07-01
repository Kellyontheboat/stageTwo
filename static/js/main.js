import { fetchAttractions, fetchMrtStations, fetchAttr, registerformSubmission, loginformSubmission, checkLoginStatus, bindBookingFormSubmission } from './api.js';
import { renderAttractions, initStationElements, renderAttr, updateLoginButton, fetchAndRenderItemsFromDB } from './render.js'; 
import { createScrollHandler } from './scroll.js';

document.addEventListener("DOMContentLoaded", async function () {
  // check user sign -in status
  const { isAuthenticated, user } = await checkLoginStatus();
  if (isAuthenticated) {
    updateLoginButton();
  }

  const pathArray = window.location.pathname.split('/');
  const pageType = pathArray[1]; // Determine the endpoint('attraction', '')

  registerformSubmission();
  loginformSubmission();

  if (pageType === 'attraction') {
    // If the path is /attraction/{id}
    const attractionId = pathArray[pathArray.length - 1];

    fetchAttr(attractionId).then(data => {
      if (data) {
        renderAttr(data.data);
      }

    const costDiv = document.querySelector('.cost-amount');
    const morningRadio = document.getElementById('morning');
    const afternoonRadio = document.getElementById('afternoon');
    morningRadio.addEventListener('change', updateCost);
    afternoonRadio.addEventListener('change', updateCost);

    function updateCost() {
      if (afternoonRadio.checked) {
        costDiv.innerText = '新台幣 2000 元';
      } else {
        costDiv.innerText = '新台幣 2500 元';
      }
    }
      bindBookingFormSubmission();

    });
  }

  else if (pageType === 'booking') {
    
    const loginStatus = await checkLoginStatus();
    const { isAuthenticated, user } = loginStatus;
    if (!isAuthenticated) {
      window.location.href = '/';
      return;
    }
    // Now user is authenticated
    const username = user.username;
    localStorage.setItem('username', username);
    localStorage.setItem('useremail', user.email);
    await fetchAndRenderItemsFromDB(username);

  } else {
    // If the path is for the homepage
    const gridContainerImg = document.querySelector('.grid-container-img');
    const loadingSentinel = document.getElementById("loading-sentinel");
    const scrollContainer = document.getElementById('scroll-container');
    const mrtInput = document.getElementById('mrt-input');
    const searchButton = document.getElementById('search-button');

    let currentPage = 0;
    let loading = false;
    let keyword = null;

    async function loadMoreAttractions() {
      if (loading) return;
      loading = true;

      const result = await fetchAttractions(currentPage, keyword);
      if (result && result.data) {
        renderAttractions(result.data);
        if (result.nextPage !== null) {
          currentPage = result.nextPage;
          loading = false;
        } else {
          window.removeEventListener('scroll', handleScroll);
          // appendFooter(); // Add footer when all pages are loaded
        }
      }
    }

    const handleScroll = createScrollHandler(loadMoreAttractions, loading);

    function updateSearch() {
      keyword = mrtInput.value;
      currentPage = 0;
      gridContainerImg.innerHTML = '';
      loading = false;
      window.addEventListener('scroll', handleScroll);
      loadMoreAttractions();
    }

    searchButton.addEventListener('click', function () {
      keyword = mrtInput.value;
      currentPage = 0;
      gridContainerImg.innerHTML = '';
      loading = false;
      window.addEventListener('scroll', handleScroll);
      loadMoreAttractions();
    });

    fetchMrtStations().then(data => {
      initStationElements(data, mrtInput, loadMoreAttractions, scrollContainer, updateSearch);
    });

    document.querySelector('.scroll-button.left').addEventListener('click', () => {
      scrollContainer.scrollBy({ left: -200, behavior: 'smooth' });
    });

    document.querySelector('.scroll-button.right').addEventListener('click', () => {
      scrollContainer.scrollBy({ left: 200, behavior: 'smooth' });
    });

    loadMoreAttractions();
    window.addEventListener('scroll', handleScroll);
  }
});
