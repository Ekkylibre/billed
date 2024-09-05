/**
 * @jest-environment jsdom
 */

import { screen, fireEvent } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import { ROUTES_PATH } from "../constants/routes.js";
import mockStore from "../__mocks__/store.js";
import router from "../app/Router"; // Importer router

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

      jest.spyOn(window, 'alert').mockImplementation(() => {});

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

    test("When updating the bill fails, it should handle the error", async () => {
      const onNavigate = jest.fn();
      const storeMock = {
        bills: jest.fn(() => ({
          update: jest.fn(() => Promise.reject(new Error("Update failed"))),
        })),
      };

      const html = NewBillUI();
      document.body.innerHTML = html;

      const newBill = new NewBill({
        document,
        onNavigate,
        store: storeMock,
        localStorage: window.localStorage,
      });

      // Remplir le formulaire avec des données valides
      newBill.fileUrl = "https://localhost:3456/images/test.jpg";
      newBill.fileName = "image.jpg";
      const form = screen.getByTestId("form-new-bill");

      fireEvent.submit(form);

      // Vérifier que la méthode update a été appelée
      expect(storeMock.bills().update).toHaveBeenCalled();

      // Assurez-vous que la navigation n'a pas eu lieu en cas d'échec
      await expect(onNavigate).not.toHaveBeenCalled();
    });

    test("Then submitting the form with missing required fields should not navigate", () => {
      const onNavigate = jest.fn();
      const storeMock = {
        bills: jest.fn(() => mockStore.bills()),
      };

      const html = NewBillUI();
      document.body.innerHTML = html;

      const newBill = new NewBill({
        document,
        onNavigate,
        store: storeMock,
        localStorage: window.localStorage,
      });

      // Simule une soumission de formulaire sans remplir les champs requis
      const form = screen.getByTestId("form-new-bill");
      const expenseNameInput = screen.getByTestId("expense-name");
      expenseNameInput.value = ""; // Laisse un champ requis vide

      // Assurez-vous que vous avez suffisamment de données pour le test
      const expenseTypeInput = screen.getByTestId("expense-type");
      expenseTypeInput.value = "Restaurants et bars";
      const amountInput = screen.getByTestId("amount");
      amountInput.value = "100";
      const dateInput = screen.getByTestId("datepicker");
      dateInput.value = "2024-09-05";
      const vatInput = screen.getByTestId("vat");
      vatInput.value = "20";
      const pctInput = screen.getByTestId("pct");
      pctInput.value = "20";
      const commentaryInput = screen.getByTestId("commentary");
      commentaryInput.value = "Commentaire";

      fireEvent.submit(form);

      // Vérifiez que la fonction onNavigate n'a pas été appelée
      expect(onNavigate).not.toHaveBeenCalled();
    });
  });
});
