import { deleteBooking } from './api.js'

const gridContainerImg = document.querySelector('.grid-container-img');
const loadingSentinel = document.getElementById("loading-sentinel");

//!render attractions
export function renderAttractions(attractions) {
  attractions.forEach(attraction => {
    const gridItem = createGridItem(attraction);
    gridContainerImg.appendChild(gridItem);
  });

  gridContainerImg.appendChild(loadingSentinel);
  updateGridRows();
}

function createGridItem(attraction) {
  const gridItem = document.createElement('div');
  gridItem.classList.add('grid-item-img');
  gridItem.setAttribute('data-id', attraction.id); //using dataset
  const imageDiv = document.createElement('div');
  imageDiv.classList.add('image-div');
  imageDiv.style.backgroundImage = `url('${attraction.images[0]}')`;

  gridItem.addEventListener('click', () => {
    const attractionId = gridItem.dataset.id;
    if (attractionId) {
      window.location.href = `/attraction/${attractionId}`;
    }
  })

  const title = document.createElement('div');
  title.classList.add('title');
  title.textContent = attraction.name;

  const spanOfImg = document.createElement('div');
  spanOfImg.classList.add('spanOfImg');

  const mrtstat = document.createElement('span');
  mrtstat.classList.add('mrtstat');
  mrtstat.textContent = attraction.mrt;

  const cat = document.createElement('span');
  cat.classList.add('cat');
  cat.textContent = attraction.category;

  spanOfImg.append(mrtstat, cat);
  gridItem.append(imageDiv, title, spanOfImg);

  return gridItem;
}

function updateGridRows() {
  const numItems = document.querySelectorAll('.grid-item-img').length;
  const numColumns = 4;
  const numRows = Math.ceil(numItems / numColumns);
  const rowHeight = window.matchMedia("(max-width: 600px)").matches ? 280 : 242; // 235 + 45, 197 + 45

  gridContainerImg.style.gridTemplateRows = `repeat(${numRows}, ${rowHeight}px)`;
}

export function initStationElements(data, mrtInput, loadMoreAttractions, scrollContainer, updateSearch) {
  const stations = data.data;

  stations.forEach(station => {
    const stationElement = document.createElement('div');
    stationElement.classList.add('station');
    stationElement.textContent = station;
    stationElement.addEventListener('click', () => {
      mrtInput.value = station;
      updateSearch();
    });
    scrollContainer.appendChild(stationElement);
  });
}

//!render attraction
export function renderAttr(attraction) {
  document.getElementById('attr-name').textContent = attraction.name;
  document.getElementById('category-mrt').textContent = `${attraction.category} at ${attraction.mrt}`;
  document.getElementById('description').textContent = attraction.description;
  document.getElementById('address').textContent = attraction.address;
  document.getElementById('direction').textContent = attraction.direction;

  const carouselBox = document.querySelector('.carousel-box');
  const indicatorContainer = document.querySelector('.carousel-indicators');
  const bookingForm = document.querySelector(".order-schedule");
  const bookingButton = bookingForm.querySelector("button[type='submit']");

  function createIndicators(count) {
    indicatorContainer.innerHTML = ''; 
    for (let i = 0; i < count; i++) {
      
      const li = document.createElement('li');
      const label = document.createElement('label');
      label.classList.add('carousel-bullet');
      if (i === 0) {
        label.classList.add('active')
      }
      //label.innerHTML = '•';
      label.setAttribute('for', `carousel-${i}`);
      li.appendChild(label);
      indicatorContainer.appendChild(li);

      // Add event listener to each bullet for direct slide navigation
      label.addEventListener('click', () => {
        setActiveSlide(i);
      });
    }
  }

  attraction.images.forEach((image, index) => {
    const img = document.createElement('img');
    img.classList.add("slides");
    img.src = image;
    img.id = `carousel-${index}`; // Set html id attribute 
    if (index === 0) {
      img.classList.add('active');
    }
    carouselBox.appendChild(img);
  });

  createIndicators(attraction.images.length);

  document.querySelector('.prev').addEventListener('click', () => {
    moveSlide(-1);
  });
  document.querySelector('.next').addEventListener('click', () => {
    moveSlide(1);
  });
  
  const attributes = {
    'attraction-id': attraction.id,
    'attraction-name': attraction.name,
    'attraction-address': attraction.address,
    'attraction-img': attraction.images[0]
  };

  localStorage.setItem("bookingData", JSON.stringify(attributes));
};

//   setAttributes(bookingButton, attributes);
// };

// function setAttributes(element, attributes) {
//   for (const key in attributes) {
//     element.setAttribute(`data-${key}`, attributes[key]);
//   }
// }

function moveSlide(direction) {
  const slides = document.querySelectorAll('.slides');
  const activeSlide = document.querySelector('.slides.active');
  let newIndex = [...slides].indexOf(activeSlide) + direction;

  if (newIndex < 0) {
    newIndex = slides.length - 1;
  } else if (newIndex >= slides.length) {
    newIndex = 0;
  }
  setActiveSlide(newIndex);
}
// set active slide and update indicators after clicking
function setActiveSlide(index) {
  const slides = document.querySelectorAll('.slides');
  const indicators = document.querySelectorAll('.carousel-bullet');

  document.querySelector('.slides.active').classList.remove('active');
  slides[index].classList.add('active');
  // operator (?.) ensures this does not throw an error if no active indicator is found
  document.querySelector('.carousel-bullet.active')?.classList.remove('active');
  indicators[index].classList.add('active');
  document.querySelector(`label[for="carousel-${index}"]`).classList.add('active');
}


//! modal

//!set showLoginModal
  let btn = document.getElementById("login-register-btn");

  btn.onclick = function () {
    showLoginModal();
  }

// LoginModal
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const loginBtn = document.getElementById('login-modal-btn');
const registerBtn = document.getElementById('register-modal-btn');
const signInForm = document.getElementById('signin-form-login');
const passwordInput = document.getElementById('password')
const msgSpanLogin = document.getElementById('login-msg');
const msgSpanRegister = document.getElementById('register-msg');

//show login modal hide register modal
export async function showLoginModal() {
  const registeredEmail = localStorage.getItem('registeredEmail');
  // Pre-fill the email input if the user just registered
  if (registeredEmail) {
    const emailInput = signInForm.querySelector('input[name="email"]');
    emailInput.value = registeredEmail;
    localStorage.removeItem('registeredEmail');
  }
  loginModal.style.display = 'block';
  registerModal.style.display = 'none';
  passwordInput.value = '';
  msgSpanLogin.innerText = '';
  registerBtn.addEventListener('click', function () {
    showRegisterModal();
  });
  closeButtons();
}

//show register modal hide login modal
export async function showRegisterModal() {
  registerModal.style.display = 'block';
  loginModal.style.display = 'none';
  msgSpanRegister.innerText = '';
  loginBtn.addEventListener('click', function () {
    showLoginModal();
    passwordInput.value = '';
  });
  closeButtons();
}

// Close modal when clicking on the close button
async function closeButtons(){
  const closeButtons = document.querySelectorAll('.close');
  closeButtons.forEach(btn => {
    btn.addEventListener('click', function (event) {
      console.log(event.target)
      loginModal.style.display = 'none';
      registerModal.style.display = 'none';
    });
  });
}

export async function updateLoginButton() {
  const loginButton = document.getElementById('login-register-btn');
  if (loginButton) {
    loginButton.innerText = '登出系統';
    loginButton.id = 'logout-btn';
  }
  const logoutBtn = document.getElementById('logout-btn');
  logoutBtn.addEventListener('click', (event) => {
    event.preventDefault(); 
    localStorage.removeItem('token');
    hideModals(); // Hide any open modals before reloading
    setTimeout(() => location.reload(), 100); // Delay reload to ensure modals are hidden
  });
}

function hideModals() {
  loginModal.style.display = 'none';
  registerModal.style.display = 'none';
}

//! booking
const bookingContainer = document.getElementById('booking-container');
export function appendNewItem(item) {

  const createDiv = (className, textContent = '') => {
    const div = document.createElement('div');
    div.className = className;
    div.textContent = textContent;
    return div;
  };

  const createSpanWithPair = (titleClass, titleText, valueClass, valueText) => {
    const span = document.createElement('span');
    span.className = 'booking-data-pair';

    const titleDiv = createDiv(titleClass, titleText);
    const valueDiv = createDiv(valueClass, valueText);

    span.appendChild(titleDiv);
    span.appendChild(valueDiv);

    return span;
  };

  const bookingItem = createDiv('booking-item');

  const bookingAttrDetail = createDiv('booking-attr-detail');

  const bookingAttrImg = createDiv('booking-attr-img');
  const img = document.createElement('img');
  img.src = item.attraction.image;
  img.alt = item.attraction.name;
  bookingAttrImg.appendChild(img);

  const bookingAttrTextWrap = createDiv('booking-attr-text-wrap');

  const attractionName = bookingAttrTextWrap.appendChild(createSpanWithPair('booking-attr-title', '台北一日遊：', 'booking-attr-name', item.attraction.name));
  attractionName.id = "booking-attr-name"

  bookingAttrTextWrap.appendChild(createSpanWithPair('booking-attr-label', '日期：', 'booking-attr-value', item.date));
  bookingAttrTextWrap.appendChild(createSpanWithPair('booking-attr-label', '時間：', 'booking-attr-value', item.time));
  bookingAttrTextWrap.appendChild(createSpanWithPair('booking-attr-label', '費用：', 'booking-attr-value', '新台幣' + item.price + '元'));
  bookingAttrTextWrap.appendChild(createSpanWithPair('booking-attr-label', '地點：', 'booking-attr-value', item.attraction.address));

  bookingAttrDetail.appendChild(bookingAttrImg);
  bookingAttrDetail.appendChild(bookingAttrTextWrap);

  const deleteButton = document.createElement('button');
  deleteButton.textContent = 'Delete';
  deleteButton.dataset.bookingId = item.id;
  deleteButton.innerHTML = '<img src="/static/pics/icon_delete.png" alt="Delete">';
  deleteButton.id = 'booking-delete-btn';

  deleteButton.addEventListener('click', async function () {
    const bookingId = this.dataset.bookingId;
    await deleteBooking(bookingId);
  });

  bookingItem.appendChild(bookingAttrDetail);
  bookingItem.appendChild(deleteButton);
  bookingContainer.appendChild(bookingItem);
}

export async function fetchAndRenderItemsFromDB(username) {

  const bookingUsername = document.getElementById('booking-username');
  bookingUsername.textContent = username;

  try {
    const token = localStorage.getItem("token");
    const response = await fetch('/api/booking', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch booking data');
    }

    const dataList = await response.json();
    document.getElementById('booking-total-cost').innerText = '總價：新台幣' + dataList.total_cost + '元'

    if (dataList.bookings.length === 0) {
      const item = document.createElement('div');
      item.classList = 'booking-message'
      item.textContent = '目前沒有任何待預訂的行程';
      const targetElement = document.getElementById('booking-content')
      const parentElement = targetElement.parentNode;
      parentElement.insertBefore(item, targetElement);
      targetElement.style.display = 'none';
      return;
    };

    console.log("fetchAndRenderItemsFromDB", dataList)
    dataList.bookings.forEach(item => appendNewItem(item.data));
    const inputName = localStorage.getItem('username');
    const inputEmail = localStorage.getItem('useremail');
    document.getElementById('booking-name').value = inputName;
    document.getElementById('booking-email').value = inputEmail;
    localStorage.removeItem('username');
    localStorage.removeItem('useremail');
  } catch (error) {
    console.error('Error fetching booking data:', error);
    // Handle error as needed (e.g., show error message)
  }
}