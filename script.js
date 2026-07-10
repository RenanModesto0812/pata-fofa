/* PataFofa — interações do site + agendamento */

(function () {
  const WHATSAPP_NUMBER = "5565999263011";

  // Horário de funcionamento: manhã e tarde (abertura → fechamento do período)
  // Intervalo de 30 em 30 minutos
  const FUNCIONAMENTO = {
    Manhã: { abertura: "08:00", fechamento: "12:00" },
    Tarde: { abertura: "13:00", fechamento: "18:00" },
  };
  const INTERVALO_MINUTOS = 30;

  /** Gera horários de abertura até fechamento (último slot = fechamento). */
  function gerarHorarios(abertura, fechamento, intervaloMin) {
    const toMinutes = (hhmm) => {
      const [h, m] = hhmm.split(":").map(Number);
      return h * 60 + m;
    };
    const toHHMM = (mins) => {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    };

    const start = toMinutes(abertura);
    const end = toMinutes(fechamento);
    const slots = [];

    for (let t = start; t <= end; t += intervaloMin) {
      slots.push(toHHMM(t));
    }
    return slots;
  }

  const HORARIOS = {
    Manhã: gerarHorarios(
      FUNCIONAMENTO.Manhã.abertura,
      FUNCIONAMENTO.Manhã.fechamento,
      INTERVALO_MINUTOS
    ),
    Tarde: gerarHorarios(
      FUNCIONAMENTO.Tarde.abertura,
      FUNCIONAMENTO.Tarde.fechamento,
      INTERVALO_MINUTOS
    ),
  };

  const header = document.getElementById("header");
  const menuToggle = document.getElementById("menuToggle");
  const nav = document.getElementById("nav");
  const yearEl = document.getElementById("year");
  const navLinks = document.querySelectorAll(".nav__link");

  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // Header shadow on scroll
  function onScroll() {
    if (!header) return;
    if (window.scrollY > 20) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Mobile menu
  if (menuToggle && nav) {
    menuToggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      menuToggle.classList.toggle("active", open);
      menuToggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
      document.body.style.overflow = open ? "hidden" : "";
    });

    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        nav.classList.remove("open");
        menuToggle.classList.remove("active");
        document.body.style.overflow = "";
      });
    });
  }

  // Active nav link by section
  const sections = document.querySelectorAll("section[id]");
  function highlightNav() {
    const scrollY = window.scrollY + 120;
    sections.forEach((section) => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute("id");
      const link = document.querySelector(`.nav__link[href="#${id}"]`);
      if (!link) return;
      if (scrollY >= top && scrollY < top + height) {
        navLinks.forEach((l) => l.classList.remove("active"));
        link.classList.add("active");
      }
    });
  }
  window.addEventListener("scroll", highlightNav, { passive: true });
  highlightNav();

  // ---------- Agendamento ----------
  const form = document.getElementById("bookingForm");
  if (!form) return;

  const dataInput = document.getElementById("data");
  const timeSlotsEl = document.getElementById("timeSlots");
  const horarioHidden = document.getElementById("horario");
  const timeRangeLabel = document.getElementById("timeRangeLabel");

  // Atualiza dicas de abertura/fechamento no HTML
  const manhaHint = document.getElementById("periodoManhaHint");
  const tardeHint = document.getElementById("periodoTardeHint");
  if (manhaHint) {
    manhaHint.textContent = `${FUNCIONAMENTO.Manhã.abertura} – ${FUNCIONAMENTO.Manhã.fechamento}`;
  }
  if (tardeHint) {
    tardeHint.textContent = `${FUNCIONAMENTO.Tarde.abertura} – ${FUNCIONAMENTO.Tarde.fechamento}`;
  }

  // Data mínima = hoje
  if (dataInput) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    dataInput.min = `${yyyy}-${mm}-${dd}`;
  }

  function clearError(name) {
    const el = form.querySelector(`[data-error-for="${name}"]`);
    if (el) el.textContent = "";
    const field = form.querySelector(`[name="${name}"]`);
    if (field) field.classList.remove("is-invalid");
  }

  function setError(name, message) {
    const el = form.querySelector(`[data-error-for="${name}"]`);
    if (el) el.textContent = message;
    const field = form.querySelector(`[name="${name}"]`);
    if (field && field.type !== "radio" && field.type !== "hidden") {
      field.classList.add("is-invalid");
    }
  }

  function getSelectedPeriodo() {
    const checked = form.querySelector('input[name="periodo"]:checked');
    return checked ? checked.value : "";
  }

  function renderTimeSlots(periodo) {
    horarioHidden.value = "";
    clearError("horario");

    if (!periodo || !HORARIOS[periodo] || !FUNCIONAMENTO[periodo]) {
      timeSlotsEl.innerHTML =
        '<p class="time-slots__hint" id="timeSlotsHint">Selecione o período para ver os horários da abertura ao fechamento.</p>';
      if (timeRangeLabel) {
        timeRangeLabel.hidden = true;
        timeRangeLabel.textContent = "";
      }
      return;
    }

    const { abertura, fechamento } = FUNCIONAMENTO[periodo];
    if (timeRangeLabel) {
      timeRangeLabel.hidden = false;
      timeRangeLabel.textContent = `${periodo}: da abertura ${abertura} até o fechamento ${fechamento}`;
    }

    timeSlotsEl.innerHTML = HORARIOS[periodo]
      .map(
        (hora) => `
      <label class="time-slot">
        <input type="radio" name="horarioRadio" value="${hora}" />
        <span class="time-slot__btn">${hora}</span>
      </label>`
      )
      .join("");

    timeSlotsEl.querySelectorAll('input[name="horarioRadio"]').forEach((radio) => {
      radio.addEventListener("change", () => {
        horarioHidden.value = radio.value;
        clearError("horario");
      });
    });
  }

  form.querySelectorAll('input[name="periodo"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      clearError("periodo");
      renderTimeSlots(radio.value);
    });
  });

  // Limpa erros ao digitar/alterar
  form.querySelectorAll("input, select, textarea").forEach((el) => {
    el.addEventListener("input", () => {
      if (el.name) clearError(el.name);
    });
    el.addEventListener("change", () => {
      if (el.name) clearError(el.name);
      if (el.name === "servico") clearError("servico");
      if (el.name === "especie") clearError("especie");
      if (el.name === "porte") clearError("porte");
      if (el.name === "periodo") clearError("periodo");
    });
  });

  function formatDateBR(isoDate) {
    if (!isoDate) return "";
    const [y, m, d] = isoDate.split("-");
    return `${d}/${m}/${y}`;
  }

  function getRadioValue(name) {
    const checked = form.querySelector(`input[name="${name}"]:checked`);
    return checked ? checked.value : "";
  }

  function validate() {
    let ok = true;

    const textFields = [
      { name: "clienteNome", msg: "Informe o seu nome." },
      { name: "petNome", msg: "Informe o nome do pet." },
      { name: "raca", msg: "Informe a raça." },
      { name: "data", msg: "Escolha a data." },
    ];

    textFields.forEach(({ name, msg }) => {
      clearError(name);
      const el = form.elements[name];
      const value = el ? String(el.value || "").trim() : "";
      if (!value) {
        setError(name, msg);
        ok = false;
      }
    });

    const radioGroups = [
      { name: "especie", msg: "Selecione a espécie." },
      { name: "porte", msg: "Selecione o porte." },
      { name: "servico", msg: "Escolha o serviço." },
      { name: "periodo", msg: "Selecione o período." },
    ];

    radioGroups.forEach(({ name, msg }) => {
      clearError(name);
      if (!getRadioValue(name)) {
        setError(name, msg);
        ok = false;
      }
    });

    clearError("horario");
    if (!horarioHidden.value) {
      setError("horario", "Escolha um horário.");
      ok = false;
    }

    // Não permitir data no passado
    if (dataInput.value) {
      const selected = new Date(dataInput.value + "T12:00:00");
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      if (selected < now) {
        setError("data", "Escolha uma data a partir de hoje.");
        ok = false;
      }
    }

    return ok;
  }

  function buildWhatsAppMessage(data) {
    const obs = data.observacoes
      ? `\n• Observações: ${data.observacoes}`
      : "";

    return (
      `Olá! Gostaria de *agendar* na *PataFofa Estética Animal* 🐾\n\n` +
      `*Tutor:* ${data.clienteNome}\n` +
      `*Pet:* ${data.petNome}\n` +
      `*Espécie:* ${data.especie}\n` +
      `*Porte:* ${data.porte}\n` +
      `*Raça:* ${data.raca}\n` +
      `*Serviço:* ${data.servico}\n` +
      `*Data:* ${formatDateBR(data.data)}\n` +
      `*Período:* ${data.periodo}\n` +
      `*Horário:* ${data.horario}` +
      obs +
      `\n\nAguardo confirmação. Obrigado(a)!`
    );
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validate()) {
      const firstError = form.querySelector(".form-error:not(:empty)");
      if (firstError) {
        firstError.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    const payload = {
      clienteNome: form.clienteNome.value.trim(),
      petNome: form.petNome.value.trim(),
      especie: getRadioValue("especie"),
      porte: getRadioValue("porte"),
      raca: form.raca.value.trim(),
      servico: getRadioValue("servico"),
      data: form.data.value,
      periodo: getRadioValue("periodo"),
      horario: horarioHidden.value,
      observacoes: form.observacoes.value.trim(),
    };

    const message = buildWhatsAppMessage(payload);
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  });
})();

