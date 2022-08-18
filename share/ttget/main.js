var videoMain = document.querySelector(".video-main")

// var lastMouseOver;

// videoMain.addEventListener("mouseover", (event) => {
//    if (!lastMouseOver.paused) {
//       lastMouseOver.pause();
//       lastMouseOver.currentTime = 0;
//    }

//    else {
//       lastMouseOver = event.target;
//       event.target.play();
//    }
// });

// videoMain.addEventListener("mouseout", (event) => {
//    event.target.pause();
//    event.target.currentTime = 0;
// });

videoMain.addEventListener("click", (event) => {
   console.log(event.target);

   if (event.target.paused) {
      event.target.scrollIntoView({behavior: "smooth", block: "center"});
      event.target.play()
   }
   else
      event.target.pause()
});

videoMain.addEventListener("dblclick", (event) => {
   event.target.requestFullscreen();
   event.target.play();
   event.target.controls = true;
});
