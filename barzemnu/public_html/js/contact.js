document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contactForm");
  const status = document.getElementById("formStatus");

  if (!form || !status) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    status.textContent = "Enviando mensaje...";
    status.className = "form-status";

    const formData = new FormData(form);

    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        status.textContent = result.message;
        status.classList.add("success");
        form.reset();
      } else {
        status.textContent = result.message;
        status.classList.add("error");
      }
    } catch (error) {
      status.textContent = "Ha ocurrido un error. Inténtalo más tarde.";
      status.classList.add("error");
    }
  });
});