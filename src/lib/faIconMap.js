import {
  FaBars,
  FaUniversity,
  FaList,
  FaMapMarkerAlt,
  FaCog,
  FaCogs,
  FaTags,
  FaUsers,
  FaRegFileAlt,
  FaMoneyBillAlt,
  FaTable,
  FaRegHandPaper,
  FaBriefcase,
  FaAddressBook,
  FaCodeBranch,
  FaCar,
  FaHandshake,
  FaRegCalendarCheck,
  FaRegEnvelopeOpen,
  FaBuilding,
  FaRegCalendarAlt,
  FaRegCalendarTimes,
  FaClipboard,
  FaEnvelopeSquare,
  FaExchangeAlt,
  FaRegEnvelope,
  FaTasks,
  FaFolder,
} from "react-icons/fa";

// Presentation-only: the backend's `Icon` field is a FontAwesome class string
// (e.g. "fa fa-university"), but this app doesn't load FontAwesome CSS. This
// maps the class names we've seen in real module data to an equivalent
// react-icons component. It's sparse by design and safe to extend — it never
// affects which nav items exist, only how they look, and anything unmapped
// just falls back to a generic folder icon.
const iconMap = {
  "fa fa-bars": FaBars,
  "fa fa-university": FaUniversity,
  "fa fa-list": FaList,
  "fa fa-map-marker": FaMapMarkerAlt,
  "fa fa-cog": FaCog,
  "fa fa-cogs": FaCogs,
  "fa fa-tags": FaTags,
  "fa fa-users": FaUsers,
  "fa fa-file-text-o": FaRegFileAlt,
  "fa fa-money": FaMoneyBillAlt,
  "fa fa-table": FaTable,
  "fa fa-hand-paper-o": FaRegHandPaper,
  "fa fa-briefcase": FaBriefcase,
  "fa fa-address-book": FaAddressBook,
  "fa fa-code-fork": FaCodeBranch,
  "fa fa-car": FaCar,
  "fa fa-handshake-o": FaHandshake,
  "fa fa-calendar-check-o": FaRegCalendarCheck,
  "fa fa-envelope-open-o": FaRegEnvelopeOpen,
  "fa fa-building": FaBuilding,
  "fa fa-calendar-o": FaRegCalendarAlt,
  "fa fa-calendar-times-o": FaRegCalendarTimes,
  "fa fa-clipboard": FaClipboard,
  "fa fa-envelope-square": FaEnvelopeSquare,
  "fa fa-exchange": FaExchangeAlt,
  "fa fa-envelope-o": FaRegEnvelope,
  "fa fa-tasks": FaTasks,
};

export function getIconForModule(iconClass) {
  return iconMap[iconClass?.trim()] || FaFolder;
}
