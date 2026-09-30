"use strict";
/* KOREL -- consulting page: the form panel's tilt, and the inquiry form (Formspree).
   Loaded after main.js, which already provides everything else on this page. */

tiltify($("#contactPanel"), { max: 3, glow: true });

/* ---------- the form: chip select, then a real submit to Formspree --------------------------
   Sign up at https://formspree.io, create a form, and paste your endpoint ID below in place of
   "YOUR_FORM_ID" (the URL Formspree gives you looks like https://formspree.io/f/abcd1234 --
   just the "abcd1234" part goes here). That's the only change needed to make this live. */
const FORMSPREE_ID = "xvkgyvza";

$$(".cf-chip").forEach(chip => {
  chip.addEventListener("click", () => {
    $$(".cf-chip").forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    $("#cf-interest").value = chip.dataset.val;
  });
});
const inquiryForm = $("#inquiryForm"), cfDone = $("#cfDone"), cfSubmit = $(".cf-submit"), cfError = $("#cfError");
inquiryForm.addEventListener("submit", async e => {
  e.preventDefault();
  cfError.hidden = true;
  cfSubmit.disabled = true;
  cfSubmit.textContent = "Sending…";
  try {
    const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: new FormData(inquiryForm)
    });
    if (!res.ok) throw new Error("Formspree returned an error");
    inquiryForm.hidden = true;
    cfDone.hidden = false;
  } catch (err) {
    cfSubmit.disabled = false;
    cfSubmit.textContent = "Send Inquiry";
    cfError.hidden = false;
  }
});
$("#cfReset").addEventListener("click", () => {
  inquiryForm.reset();
  $$(".cf-chip").forEach(c => c.classList.remove("active"));
  $("#cf-interest").value = "";
  cfDone.hidden = true;
  inquiryForm.hidden = false;
  cfSubmit.disabled = false;
  cfSubmit.textContent = "Send Inquiry";
});
