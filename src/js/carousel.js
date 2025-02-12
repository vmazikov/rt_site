const buttons = document.querySelectorAll(".equipment-section__button");
const track = document.querySelector(".equipment-section__carousel__track");
const dots = document.querySelectorAll(".equipment-section__carousel__dot");
let currentIndex = 0;
let autoSlideInterval;

const updateCarousel = (index) => {
  track.style.transform = `translateX(-${index * 100}%)`;
  dots.forEach((dot, i) => dot.classList.toggle("equipment-section__carousel__dot_active", i === index));
};

const setActiveCategory = (category) => {
  const items = document.querySelectorAll(".equipment-section__carousel__item");
  items.forEach(item => {
    if (item.dataset.category === category) {
      console.log()
      item.style.display = "block";
    } else {
      item.style.display = "none";
    }
  });
};

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    buttons.forEach(btn => btn.classList.remove("equipment-section__button_active"));
    button.classList.add("equipment-section__button_active");
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