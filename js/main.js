/* ========================================
   SALA — MODERN THAI KITCHEN
   Main JavaScript
======================================== */


/* ========================================
   1. MOBILE NAVIGATION
======================================== */

const menuToggle = document.querySelector(".menu-toggle");
const navMenu = document.querySelector(".nav-menu");

if (menuToggle && navMenu) {
  menuToggle.addEventListener("click", () => {
    const isOpen = navMenu.classList.toggle("show");

    menuToggle.setAttribute("aria-expanded", isOpen);
    menuToggle.setAttribute(
      "aria-label",
      isOpen ? "Close navigation menu" : "Open navigation menu"
    );

    menuToggle.textContent = isOpen ? "✕" : "☰";
  });

  // Close the mobile menu after clicking a navigation link
  navMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navMenu.classList.remove("show");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open navigation menu");
      menuToggle.textContent = "☰";
    });
  });
}


/* ========================================
   2. RESERVATION DATE VALIDATION
======================================== */

const reservationDate = document.querySelector("#date");

if (reservationDate) {
  const today = new Date();

  const localToday = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  reservationDate.min = localToday;
}

/* ========================================
   3. LOAD MENU FROM BACKEND API
======================================== */

const menuContainer = document.querySelector(".menu-list");
const categoryButtons = document.querySelectorAll(".category-button");

let menuItems = [];

// Cache dish elements so category filtering can reuse them
const menuElementCache = new Map();

async function loadMenu() {
    if (!menuContainer) {
      return;
    }
  
    try {
      // Request menu data from the backend
      const response = await fetch("http://localhost:3000/api/menu");
  
      // Check whether the request was successful
      if (!response.ok) {
        throw new Error("Failed to load menu");
      }
  
      // Convert the response into JavaScript data
      const result = await response.json();
  
      // Store the menu items
      menuItems = result.data;
  
      // Check whether the backend returned a valid list of dishes
      if (!Array.isArray(menuItems) || menuItems.length === 0) {
        menuContainer.innerHTML = `
          <p class="menu-empty">
            Our menu is being updated. Please check back soon.
          </p>
        `;
        return;
      }
  
      // Display the menu items
      displayMenu(menuItems);
  
    } catch (error) {
      // Show the error in the browser console
      console.error("Menu loading error:", error);
  
      // Display a friendly message on the page
      menuContainer.innerHTML = `
        <p class="menu-error">
          Sorry, we couldn't load the menu right now.
          Please try again later.
        </p>
      `;
    }
  }

/* ========================================
   3. DISPLAY MENU WITH CACHED DISHES
======================================== */

function displayMenu(items) {
  if (!menuContainer) {
    return;
  }

  // Show a message if no dishes match the selected category
  if (items.length === 0) {
    menuContainer.innerHTML = `
      <p class="menu-empty">No dishes found.</p>
    `;
    return;
  }

  // Remove the current display but keep cached dish elements
  menuContainer.replaceChildren();

  // Prepare all visible dishes before adding them to the page
  const fragment = document.createDocumentFragment();

  items.forEach((item) => {
    // Use the dish ID when available to identify each dish
    const key =
      item.id != null
        ? String(item.id)
        : JSON.stringify([
            item.category ?? "",
            item.name ?? "",
            item.price ?? "",
          ]);

    let menuItem = menuElementCache.get(key);

    // Create the dish card only if it hasn't been created before
    if (!menuItem) {
      menuItem = document.createElement("div");
      menuItem.classList.add("menu-item");
      menuItem.dataset.category = item.category;

      const imagePath = window.location.pathname.includes("/pages/")
        ? "../images/dishes/"
        : "images/dishes/";

      menuItem.innerHTML = `
        <img
          class="menu-item-image"
          src="${imagePath}${item.image || ""}"
          alt="${item.name}"
          loading="lazy"
        >

        <div class="menu-item-info">
          <h3>${item.name}</h3>
          <p>${item.description}</p>
        </div>

        <span class="menu-price">฿${item.price}</span>
      `;

      // Hide the image if the file cannot be found
      const dishImage = menuItem.querySelector(".menu-item-image");

      dishImage.addEventListener("error", () => {
        dishImage.style.display = "none";
      });

      // Save the card for future category changes
      menuElementCache.set(key, menuItem);
    }

    fragment.appendChild(menuItem);
  });

  // Add all matching dishes together
  menuContainer.appendChild(fragment);
}

/* ========================================
   4. MENU CATEGORY FILTER
======================================== */

categoryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    // Skip unnecessary work when the active category is clicked again
    if (button.classList.contains("active")) {
      return;
    }

    // Update the active button
    categoryButtons.forEach((btn) => {
      btn.classList.remove("active");
    });

    button.classList.add("active");

    // Read the selected category
    const selectedCategory = button.dataset.category;

    // Filter the already-loaded menu without another API request
    if (selectedCategory === "all") {
      displayMenu(menuItems);
    } else {
      const filteredItems = menuItems.filter((item) => {
        return item.category === selectedCategory;
      });

      displayMenu(filteredItems);
    }
  });
});

/* ========================================
   5. RESERVATION FORM
======================================== */

const reservationForm = document.querySelector("#reservation-form");

const reservationMessage = document.querySelector("#reservation-message");

const reservationButton = document.querySelector("#reservation-submit");

// Hide the old confirmation when the user edits the form
if (reservationForm && reservationMessage) {
    reservationForm.addEventListener("input", () => {
      reservationMessage.hidden = true;
      reservationMessage.textContent = "";
      reservationMessage.classList.remove("success", "error");
    });
  }

if (reservationForm) {
  reservationForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    // Prevent duplicate submissions
    if (reservationButton && reservationButton.disabled) {
      return;
    }

    // Save the original button text
    const originalButtonText = reservationButton
      ? reservationButton.textContent
      : "";

    // Show the loading state
    if (reservationButton) {
      reservationButton.disabled = true;
      reservationButton.textContent = "Submitting...";
    }

    const loadingStartTime = Date.now();

    const formData = new FormData(reservationForm);

    const reservationData = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("http://localhost:3000/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reservationData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to submit reservation");
      }

      // Show the confirmation message directly on the page
      if (reservationMessage) {
        reservationMessage.textContent =
          "Thank you! Your reservation request has been received. " +
          "We look forward to welcoming you to SALA.";

        reservationMessage.classList.remove("error");
        reservationMessage.classList.add("success");
        reservationMessage.hidden = false;
      } else {
        alert("Your reservation request has been submitted!");
      }

      // Clear the form after a successful submission
      reservationForm.reset();
    } catch (error) {
      console.error("Reservation error:", error);

      if (reservationMessage) {
        reservationMessage.textContent =
          error.message ||
          "Sorry, we couldn't submit your reservation. Please try again.";

        reservationMessage.classList.remove("success");
        reservationMessage.classList.add("error");
        reservationMessage.hidden = false;
      } else {
        alert(
          error.message ||
            "Sorry, we couldn't submit your reservation. Please try again."
        );
      }
    } finally {
      // Keep the loading state visible for at least 500ms
      const elapsedTime = Date.now() - loadingStartTime;
      const remainingTime = Math.max(0, 500 - elapsedTime);

      await new Promise((resolve) => {
        setTimeout(resolve, remainingTime);
      });

      // Restore the button after success or failure
      if (reservationButton) {
        reservationButton.disabled = false;
        reservationButton.textContent = originalButtonText;
      }
    }
  });
}

/* ========================================
   6. INITIALIZE MENU
======================================== */

// Load the menu when the page opens
loadMenu();


/* ========================================
   7. CONTACT FORM
======================================== */

const contactForm = document.querySelector("#contact-form");
const contactStatus = document.querySelector("#contact-status");

if (contactForm && contactStatus) {
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = contactForm.querySelector(
      'button[type="submit"], input[type="submit"]'
    );

    const originalButtonText = submitButton
      ? submitButton.textContent
      : "";

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Sending...";
    }

    contactStatus.hidden = false;
    contactStatus.classList.remove("success", "error");
    contactStatus.textContent = "Sending your message...";

    const formData = new FormData(contactForm);

    const contactData = Object.fromEntries(formData.entries());

    try {
      const response = await fetch(
        "http://localhost:3000/api/contact",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(contactData)
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to send your message."
        );
      }

      contactStatus.textContent = result.message;
      contactStatus.classList.add("success");
      contactForm.reset();

    } catch (error) {
      console.error("Contact form error:", error);

      contactStatus.textContent =
        error.message ||
        "Sorry, we couldn't send your message. Please try again.";

      contactStatus.classList.add("error");

    } finally {
      if (submitButton) {
        submitButton.disabled = false;

        if (submitButton.tagName === "INPUT") {
          submitButton.value = originalButtonText;
        } else {
          submitButton.textContent = originalButtonText;
        }
      }
    }
  });
}

