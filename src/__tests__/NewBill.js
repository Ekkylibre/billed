/**
 * @jest-environment jsdom
 */

import { screen, fireEvent, waitFor } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import { ROUTES_PATH } from "../constants/routes.js";
import mockStore from "../__mocks__/store.js";
import router from "../app/Router.js";

jest.mock("../app/Store", () => mockStore);

describe("Given I am connected as an employee", () => {
  beforeEach(() => {
    // Mock le localStorage pour simuler l'utilisateur connecté
    Object.defineProperty(window, "localStorage", { value: localStorageMock });
    window.localStorage.setItem("user", JSON.stringify({
      type: "Employee",
      email: "employee@test.tld"
    }));

    // Crée un élément racine pour le rendu du DOM
    const root = document.createElement("div");
    root.setAttribute("id", "root");
    document.body.appendChild(root);

    // Initialise le router
    router();
  });

  describe("When I am on NewBill Page", () => {

    test("Then the new bill form should be rendered", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      // Vérifie que tous les champs du formulaire sont présents
      expect(screen.getByTestId("expense-type")).toBeTruthy();
      expect(screen.getByTestId("expense-name")).toBeTruthy();
      expect(screen.getByTestId("datepicker")).toBeTruthy();
      expect(screen.getByTestId("amount")).toBeTruthy();
      expect(screen.getByTestId("vat")).toBeTruthy();
      expect(screen.getByTestId("pct")).toBeTruthy();
      expect(screen.getByTestId("commentary")).toBeTruthy();
      expect(screen.getByTestId("file")).toBeTruthy();
      expect(screen.getByTestId("form-new-bill")).toBeTruthy();
    });

    test("Then the content title should be displayed", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      // Vérifie que le titre du contenu est affiché
      expect(screen.getByText("Envoyer une note de frais")).toBeTruthy();
    });

    test("Then a file with the wrong format should trigger an alert", () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES_PATH[pathname];
      };

      // Réinitialise le localStorage pour le test
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });
      window.localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "employee@test.com" }));

      const html = NewBillUI();
      document.body.innerHTML = html;

      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      const handleChangeFile = jest.fn(newBill.handleChangeFile.bind(newBill));
      const fileInput = screen.getByTestId("file");

      // Mock de l'alerte pour tester les appels
      jest.spyOn(window, 'alert').mockImplementation(() => { });

      const file = new File([""], "example.pdf", { type: "application/pdf" });
      fileInput.addEventListener("change", handleChangeFile);
      fireEvent.change(fileInput, { target: { files: [file] } });

      // Vérifie que la fonction de gestion de changement de fichier est appelée et que l'alerte est affichée
      expect(handleChangeFile).toHaveBeenCalled();
      expect(window.alert).toHaveBeenCalledWith("Veuillez choisir un type d'image valide. Les formats acceptés sont : .jpg, .jpeg, .png.");
      expect(fileInput.value).toBe("");

      window.alert.mockRestore(); // Restaure le comportement d'origine de l'alerte
    });

    test("When I upload a file with the correct format, it should be accepted and stored", () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES_PATH[pathname];
      };

      // Réinitialise le localStorage pour le test
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });
      window.localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "employee@test.com" }));

      const html = NewBillUI();
      document.body.innerHTML = html;

      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      const handleChangeFile = jest.fn(newBill.handleChangeFile.bind(newBill));
      const fileInput = screen.getByTestId("file");

      const file = new File(["image content"], "image.jpg", { type: "image/jpeg" });
      fileInput.addEventListener("change", handleChangeFile);
      fireEvent.change(fileInput, { target: { files: [file] } });

      // Vérifie que la fonction de gestion de changement de fichier est appelée et que le fichier est correctement stocké
      expect(handleChangeFile).toHaveBeenCalled();
      expect(fileInput.files[0].name).toBe("image.jpg");
    });

    test("When the update fails, it should log an error in the console", async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES_PATH[pathname];
      };

      // Mock du store pour simuler un échec de mise à jour
      const storeMock = {
        bills: jest.fn(() => ({
          update: jest.fn(() => Promise.reject(new Error("Update failed"))),
        })),
      };

      // Réinitialise le localStorage pour le test
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });
      window.localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "employee@test.com" }));

      const html = NewBillUI();
      document.body.innerHTML = html;

      const newBill = new NewBill({
        document,
        onNavigate,
        store: storeMock,
        localStorage: window.localStorage,
      });

      const handleSubmit = jest.fn(newBill.handleSubmit);
      newBill.fileUrl = "https://localhost:3456/images/test.jpg";
      newBill.fileName = "image.jpg";

      const form = screen.getByTestId("form-new-bill");
      form.addEventListener("submit", handleSubmit);

      // Spy pour vérifier les erreurs dans la console
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      fireEvent.submit(form);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(new Error("Update failed"));
      });

      consoleErrorSpy.mockRestore(); // Restaure le comportement d'origine de console.error
    });

    test("Then billId, fileUrl, and fileName should be correctly assigned", () => {
      document.body.innerHTML = NewBillUI();
    
      const newBill = new NewBill({
        document: document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: window.localStorage,
      });
    
      const fileUrl = "https://localhost:3456/images/test.jpg";
      const key = "1234";
      const fileName = "test.jpg";
    
      newBill.billId = key;
      newBill.fileUrl = fileUrl;
      newBill.fileName = fileName;
    
      // Vérifie que les propriétés sont correctement assignées
      expect(newBill.billId).toBe("1234");
      expect(newBill.fileUrl).toBe("https://localhost:3456/images/test.jpg");
      expect(newBill.fileName).toBe("test.jpg");
    });

    // Intégration POST
    test("Then submitting the form with valid data should navigate to Bills page", () => {
      const onNavigate = jest.fn();
      // Mock du store pour simuler une création réussie
      const storeMock = {
        bills: jest.fn(() => ({
          create: jest.fn(() => Promise.resolve({ fileUrl: 'https://localhost:3456/images/test.jpg', key: '1234' })),
          update: jest.fn(() => Promise.resolve())
        }))
      };

      const html = NewBillUI();
      document.body.innerHTML = html;

      const newBill = new NewBill({
        document,
        onNavigate,
        store: storeMock,
        localStorage: window.localStorage,
      });

      const handleSubmit = jest.fn(newBill.handleSubmit);
      newBill.fileUrl = "https://localhost:3456/images/test.jpg";
      newBill.fileName = "image.jpg";

      const form = screen.getByTestId("form-new-bill");
      form.addEventListener("submit", handleSubmit);

      fireEvent.submit(form);

      // Vérifie que la fonction de soumission est appelée et que la navigation se fait vers la page Bills
      expect(handleSubmit).toHaveBeenCalled();
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH['Bills']);
    });

    // Gestion des erreurs 404 et 500
    test("Then submitting the form with valid data should handle 404 error", async () => {
      const postSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      // Mock du store pour simuler une erreur 404
      const storeMock = {
        bills: jest.fn(() => ({
          create: jest.fn(() => Promise.reject(new Error("404"))),
          update: jest.fn(() => Promise.reject(new Error("404"))),
        })),
      };

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES_PATH[pathname];
      };

      const html = NewBillUI();
      document.body.innerHTML = html;

      const newBill = new NewBill({
        document,
        onNavigate,
        store: storeMock,
        localStorage: window.localStorage,
      });

      const handleSubmit = jest.fn(newBill.handleSubmit);
      newBill.fileUrl = "https://localhost:3456/images/test.jpg";
      newBill.fileName = "image.jpg";

      const form = screen.getByTestId("form-new-bill");
      form.addEventListener("submit", handleSubmit);

      fireEvent.submit(form);
      await waitFor(() => {
        // Vérifie que l'erreur 404 est bien loggée dans la console
        expect(postSpy).toHaveBeenCalledWith(new Error("404"));
      });

      postSpy.mockRestore(); // Restaure le comportement d'origine de console.error
    });

    test("Then submitting the form with valid data should handle 500 error", async () => {
      const postSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      // Mock du store pour simuler une erreur 500
      const storeMock = {
        bills: jest.fn(() => ({
          create: jest.fn(() => Promise.reject(new Error("500"))),
          update: jest.fn(() => Promise.reject(new Error("500"))),
        })),
      };

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES_PATH[pathname];
      };

      const html = NewBillUI();
      document.body.innerHTML = html;

      const newBill = new NewBill({
        document,
        onNavigate,
        store: storeMock,
        localStorage: window.localStorage,
      });

      const handleSubmit = jest.fn(newBill.handleSubmit);
      newBill.fileUrl = "https://localhost:3456/images/test.jpg";
      newBill.fileName = "image.jpg";

      const form = screen.getByTestId("form-new-bill");
      form.addEventListener("submit", handleSubmit);

      fireEvent.submit(form);
      await waitFor(() => {
        // Vérifie que l'erreur 500 est bien loggée dans la console
        expect(postSpy).toHaveBeenCalledWith(new Error("500"));
      });

      postSpy.mockRestore(); // Restaure le comportement d'origine de console.error
    });

  });
});
