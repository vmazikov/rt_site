const buttons = document.querySelectorAll(".equipment-buttons button");
const track = document.querySelector(".carousel-track");
const dots = document.querySelectorAll(".dot");
let currentIndex = 0;
let autoSlideInterval;

const updateCarousel = (index) => {
  track.style.transform = `translateX(-${index * 100}%)`;
  dots.forEach((dot, i) => dot.classList.toggle("active", i === index));
};

const setActiveCategory = (category) => {
  const items = document.querySelectorAll(".carousel-item");
  items.forEach(item => {
    if (item.dataset.category === category) {
      item.style.display = "block";
    } else {
      item.style.display = "none";
    }
  });
};

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    buttons.forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");
    setActiveCategory(button.dataset.category);
  });
});

dots.forEach((dot, index) => {
  dot.addEventListener("click", () => {
    currentIndex = index;
    updateCarousel(index);
  });
});

const autoSlide = () => {
  autoSlideInterval = setInterval(() => {
    currentIndex = (currentIndex + 1) % dots.length;
    updateCarousel(currentIndex);
  }, 7000);
};

autoSlide();