import VerticalLayout from "./VerticalLayout.js";
import ErrorPage from "./ErrorPage.js";
import LoadingPage from "./LoadingPage.js";
import Actions from "./Actions.js";

/*Fix bug 1*/
// Tableau de correspondance des mois avec les noms en français
const monthMap = {
  Jan: 0, Févr: 1, Mar: 2, Avr: 3, Mai: 4, Juin: 5,
  Juil: 6, Août: 7, Sep: 8, Oct: 9, Nov: 10, Déc: 11
};

// Fonction pour convertir une date au format "dd Mmm yy" en objet Date
const parseDate = (dateString) => {
  const [day, monthAbbr, year] = dateString.split(' ');

  // Correction de l'abréviation des mois
  const month = monthMap[monthAbbr.replace(/\./g, '')]; // Enlever les points des mois
  const fullYear = year.length === 2 ? `20${year}` : year; // Convertir année en 4 chiffres si nécessaire

  // Gestion de jours et mois non définis
  if (isNaN(month) || isNaN(day)) return new Date('Invalid Date');

  return new Date(fullYear, month, day);
};

const row = (bill) => {
  const billDate = bill.formatedDate ?? bill.date;
  return `
    <tr data-testid="bill">
      <td>${bill.type}</td>
      <td>${bill.name}</td>
      <td>${billDate}</td>
      <td>${bill.amount} €</td>
      <td>${bill.status}</td>
      <td>
        ${Actions(bill.fileUrl)}
      </td>
    </tr>
  `;
};

const rows = (data) => {
  if (!data || !data.length) return "";

  const sortedData = data
    .sort((a, b) => parseDate(b.date) - parseDate(a.date));

  return sortedData
    .map((bill) => row(bill))
    .join("");
};

export default ({ data: bills, loading, error }) => {
  const modal = () => `
    <div class="modal fade" id="modaleFile" tabindex="-1" role="dialog" aria-labelledby="exampleModalCenterTitle" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-lg" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="exampleModalLongTitle">Justificatif</h5>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
          </div>
        </div>
      </div>
    </div>
  `;

  if (loading) {
    return LoadingPage();
  } else if (error) {
    return ErrorPage(error);
  }

  return `
    <div class='layout'>
      ${VerticalLayout(120)}
      <div class='content'>
        <div class='content-header'>
          <div class='content-title'> Mes notes de frais </div>
          <button type="button" data-testid='btn-new-bill' class="btn btn-primary">Nouvelle note de frais</button>
        </div>
        <div id="data-table">
          <table id="example" class="table table-striped" style="width:100%">
            <thead>
              <tr>
                <th>Type</th>
                <th>Nom</th>
                <th>Date</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody data-testid="tbody">
              ${rows(bills)}
            </tbody>
          </table>
        </div>
      </div>
      ${modal()}
    </div>`;
};
