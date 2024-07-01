import { showLoginModal, fetchAndRenderItemsFromDB } from './render.js'

//! fetch attrs
export async function fetchAttractions(page = 0, keyword = null) {
  const size = 12;
  let url = `/api/attractions?page=${page}&size=${size}`;
  if (keyword) {
    url += `&keyword=${encodeURIComponent(keyword)}`;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching attractions:", error);
    return null;
  }
}

export async function fetchMrtStations() {
  try {
    const response = await fetch('/api/mrts');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching MRT stations:", error);
    return null;
  }
}

export async function fetchAttr(id) {
  try {
    const response = await fetch(`/api/attraction/${id}`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching attraction:", error);
    return null;
  }
}

// ! Form submission
// Handle registration form submission
export async function registerformSubmission() {
  const registerForm = document.getElementById('signin-form-register');
  const registerMessage = document.getElementById('register-msg');

  registerForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    const formData = new FormData(registerForm);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password')
    };

    // Check if all fields are filled
    if (!data.name || !data.email || !data.password) {
      registerMessage.innerText = '請輸入所有欄位';
      registerMessage.style.color = 'red';
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      registerMessage.innerText = '請輸入正確信箱格式';
      registerMessage.style.color = 'red';
      return;
    }

    try {
      const response = await fetch('/api/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      //if BE return ok true
      if (response.ok) {
        registerMessage.innerText = '註冊成功，請登入系統';
        registerMessage.style.color = 'green';
        // Store the registered email in localstorage
        localStorage.setItem('registeredEmail', data.email)
      } else {
        const errorData = await response.json();
        //key of custom_http_exception_handler: message
        //if email already exist or ...
        if (errorData.message) {
          registerMessage.innerText = errorData.message;
          registerMessage.style.color = 'red';
        } else {
          alert(`Error: ${errorData.detail}`);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      alert('註冊過程發生錯誤，請再嘗試一次');
    }
  });
};

export async function loginformSubmission(){
  const signInForm = document.getElementById('signin-form-login');
  const msgSpan = document.getElementById('login-msg');

  if (signInForm) {
    signInForm.addEventListener('submit', async function (event) {
      event.preventDefault(); // Prevent default form submission

      const formData = new FormData(signInForm);
      // data sent to BE
      const data = {
        email: formData.get('email'),
        password: formData.get('password')
      };
      //call BE api to sent data
      try {
        const response = await fetch('/api/user/auth', {
          method: 'PUT', // Correct method should be PUT for login
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });

        if (response.ok) {
          const responseData = await response.json();
          localStorage.setItem('token', responseData.token);
          location.reload(); 
        } else {
          const errorData = await response.json();
          console.log(errorData)

          if (errorData.message == 'Incorrect email or password') {
            msgSpan.innerText = '電子郵件或密碼錯誤'; 
            msgSpan.style.color = 'red';
          }
        }
      } catch (error) {
        console.error('Error logging in:', error);
        msgSpan.innerText = '發生錯誤，請稍後再試';
        msgSpan.style.color = 'red';
      }
    });
  }
};

export async function checkLoginStatus() {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const response = await fetch('/api/user/auth', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error('Response status:', response.status, response.statusText);
        
        throw new Error('Network response was not ok');
      }
      const userData = await response.json();
      return {
        isAuthenticated: true,
        user: userData.data
      };
    } catch (error) {
      console.error('Error fetching user data:', error);
      return {
        isAuthenticated: false,
        user: null
      };
    }
  }
  return {
    isAuthenticated: false,
    user: null
  };
}

//! booking
//combine the form data and attr data
export async function submitBookingForm(event) {
  event.preventDefault(); // Prevent submission
  console.log('submitBookingForm called');

  const bookingForm = document.querySelector(".order-schedule");  
  const bookingString = localStorage.getItem('bookingData'); //from renderAttr
  //parse the JSON in to js obj(like dict in python)
  const bookingObject = JSON.parse(bookingString);
  const attractionId = bookingObject['attraction-id']
  const attractionName = bookingObject['attraction-name']
  const attractionAddress = bookingObject['attraction-address']
  const attractionImage = bookingObject['attraction-img']

  const token = localStorage.getItem('token')

  const { isAuthenticated } = await checkLoginStatus();
  if (!isAuthenticated) {
    showLoginModal();
    localStorage.removeItem("bookingData");
    return;
  }

  const formData = new FormData(bookingForm);
  const date = formData.get("date");
  const time = formData.get("time");

  let price = '';
  if (time === 'morning') {
    price = 2500;
  } else {
    price = 2000;
  }

  const bookingData = {
    data: {
      attraction: {
        id: attractionId,
        name: attractionName,
        address: attractionAddress,
        image: attractionImage
      },
      date: date,
      time: time,
      price: price
    }
  };
//add (attr+formData) into DB
  try {
    const response = await fetch("/api/booking", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(bookingData)
    });

    if (response.ok) {
      let data = await response.json();
      delete data.member_id; //conform api doc
      window.location.href = "/booking";
      return data;
    } else {
      const errorData = await response.json();
      console.error("Booking failed", errorData);
      throw new Error("Booking failed");
    }
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

export function bindBookingFormSubmission() {
  const bookingForm = document.querySelector(".order-schedule");
  const bookingButton = bookingForm.querySelector("button[type='submit']");

  bookingButton.addEventListener("click", async (event) => {
    event.preventDefault();
    const dateInput = document.getElementById('date');
    const timeInputs = document.querySelectorAll('#time input[type="radio"]');

    const { isAuthenticated } = await checkLoginStatus();
    if (!isAuthenticated) {
      showLoginModal();
      localStorage.removeItem("bookingData");
      return;
    }

    if (!dateInput.value) {
      alert('請選擇日期！');
      return; n
    }

    let timeSelected = false;
    timeInputs.forEach(input => {
      if (input.checked) {
        timeSelected = true;
      }
    });

    if (!timeSelected) {
      alert('請選擇時間！');
      return;
    }

    await submitBookingForm(event);
  });
};

async function navBookingBtn () {
  const navBookingBtn = document.getElementById('to-booking-btn');
  const loginStatus = await checkLoginStatus();
  const { isAuthenticated, user } = loginStatus;

  navBookingBtn.addEventListener('click', () => {
    if (!isAuthenticated) {
      showLoginModal();
    }
    const username = user.username
    window.location.href = '/booking';
    fetchAndRenderItemsFromDB(username);
  });
};

navBookingBtn();

export async function deleteBooking(bookingId) {
  const token = localStorage.getItem('token');
  try {
    const response = await fetch(`/api/booking/${bookingId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      console.log('Booking deleted successfully');
      const bookingItem = document.querySelector(`[data-booking-id="${bookingId}"]`).closest('.booking-item');
      bookingItem.remove();
    } else {
      console.error('Failed to delete booking', await response.json());
    }
  } catch (error) {
    console.error('Error:', error);
  }
}