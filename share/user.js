var videoMain = document.querySelector(".video-main");

videoMain.addEventListener("click", (event) => {
   console.log(event.target);

   if (event.target.paused) {
      event.target.scrollIntoView({ behavior: "smooth", block: "center" });
      event.target.play();
      document.addEventListener("scroll", () => {
         console.log(window.pageYOffset - event.target.offsetTop);
      })
   } else event.target.pause();
});

videoMain.addEventListener("dblclick", (event) => {
   event.target.requestFullscreen();
   event.target.play();
   event.target.controls = true;
});
