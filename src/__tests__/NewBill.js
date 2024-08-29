/**
 * @jest-environment jsdom
 */

import { screen, fireEvent } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import { ROUTES_PATH } from "../constants/routes.js";
import store from "../__mocks__/store.js";

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
        store: store,
        localStorage: window.localStorage,
      });

      const handleChangeFile = jest.fn(newBill.handleChangeFile);
      const fileInput = screen.getByTestId("file");

      // Espionner window.alert
      jest.spyOn(window, 'alert').mockImplementation(() => {});

      // Créez un événement mock avec un fichier au mauvais format (par exemple, .pdf)
      const file = new File(["(⌐□_□)"], "chucknorris.pdf", {
        type: "application/pdf",
      });
      fileInput.addEventListener("change", handleChangeFile);
      fireEvent.change(fileInput, {
        target: {
          files: [file],
        },
      });

      // Vérifiez que la fonction a été appelée
      expect(handleChangeFile).toHaveBeenCalled();
      // Vérifiez que l'alerte a été appelée avec le bon message
      expect(window.alert).toHaveBeenCalledWith("Veuillez choisir un type d'image valide. Les formats acceptés sont : .jpg, .jpeg, .png.");
      // Vérifiez que l'input file a été réinitialisé
      expect(fileInput.value).toBe("");

      // Nettoyez le mock après le test
      window.alert.mockRestore();
    });

    test("Then submitting the form with valid data should navigate to Bills page", () => {
      const onNavigate = jest.fn();
      const storeMock = {
        bills: jest.fn(() => store.bills()),
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
      newBill.fileUrl = "https://test.com/image.jpg";
      newBill.fileName = "image.jpg";

      const form = screen.getByTestId("form-new-bill");
      form.addEventListener("submit", handleSubmit);

      fireEvent.submit(form);

      expect(handleSubmit).toHaveBeenCalled();
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH['Bills']);
    });
  });
});
