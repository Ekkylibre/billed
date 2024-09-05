/**
 * @jest-environment jsdom
 */

import { screen, fireEvent, waitFor } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import { ROUTES_PATH } from "../constants/routes.js";
import mockStore from "../__mocks__/store.js";

jest.mock("../app/Store", () => mockStore);

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {

    test("Then the new bill form should be rendered", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      // Verify that all form fields are present
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

      // Verify that the content title is rendered
      expect(screen.getByText("Envoyer une note de frais")).toBeTruthy();
    });

    test("Then a file with the wrong format should trigger an alert", () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES_PATH[pathname];
      };
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "employee@test.com",
        })
      );

      const html = NewBillUI();
      document.body.innerHTML = html;

      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      const handleChangeFile = jest.fn(newBill.handleChangeFile);
      const fileInput = screen.getByTestId("file");

      jest.spyOn(window, 'alert').mockImplementation(() => { });

      const file = new File([""], "example.pdf", {
        type: "application/pdf",
      });
      fileInput.addEventListener("change", handleChangeFile);
      fireEvent.change(fileInput, {
        target: {
          files: [file],
        },
      });

      expect(handleChangeFile).toHaveBeenCalled();
      expect(window.alert).toHaveBeenCalledWith("Veuillez choisir un type d'image valide. Les formats acceptés sont : .jpg, .jpeg, .png.");
      expect(fileInput.value).toBe("");

      window.alert.mockRestore();
    });

    test("When I upload a file with the correct format, it should be accepted and stored", () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES_PATH[pathname];
      };
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "employee@test.com",
        })
      );

      const html = NewBillUI();
      document.body.innerHTML = html;

      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      const handleChangeFile = jest.fn(newBill.handleChangeFile);
      const fileInput = screen.getByTestId("file");

      const file = new File(["image content"], "image.jpg", {
        type: "image/jpeg",
      });

      fileInput.addEventListener("change", handleChangeFile);
      fireEvent.change(fileInput, {
        target: {
          files: [file],
        },
      });

      expect(handleChangeFile).toHaveBeenCalled();
      expect(fileInput.files[0].name).toBe("image.jpg");
    });

    test("When the update fails, it should log an error in the console", async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES_PATH[pathname];
      };

      // Mock de la méthode update pour qu'elle échoue
      const storeMock = {
        bills: jest.fn(() => ({
          update: jest.fn(() => Promise.reject(new Error("Update failed"))),
        })),
      };

      Object.defineProperty(window, 'localStorage', { value: localStorageMock });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "employee@test.com",
        })
      );

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

      // Spy sur console.error pour vérifier qu'une erreur est bien loguée
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      fireEvent.submit(form);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(new Error("Update failed"));
      });

      consoleErrorSpy.mockRestore();
    });

    // Intégration POST
    test("Then submitting the form with valid data should navigate to Bills page", () => {
      const onNavigate = jest.fn();
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

      // Assurez-vous que handleSubmit a été appelé
      expect(handleSubmit).toHaveBeenCalled();

      // Assurez-vous que onNavigate a été appelé avec la bonne valeur
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH['Bills']);
    });


  });
});
