import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBullseye, faGauge, faUsers, faCode, faComments, faLanguage,
  faIdCard, faRightFromBracket, faRightToBracket, faArrowLeft,
  faArrowRight, faDownload, faUpload, faPlus, faXmark, faEye,
  faShieldHalved, faGraduationCap, faBuilding, faChalkboardUser,
  faUserGraduate, faFileCsv, faRankingStar, faTrophy, faBriefcase,
  faCircleCheck, faHourglassHalf, faIndianRupeeSign, faTriangleExclamation,
  faChartLine, faArrowUp, faArrowDown, faRotate, faUserXmark,
  faPen, faFloppyDisk, faSearch, faFilter, faHome, faInfoCircle,
} from '@fortawesome/free-solid-svg-icons';

// Map of name -> icon
const ICONS = {
  bullseye: faBullseye,
  gauge: faGauge,
  users: faUsers,
  code: faCode,
  comments: faComments,
  language: faLanguage,
  'id-card': faIdCard,
  'right-from-bracket': faRightFromBracket,
  'right-to-bracket': faRightToBracket,
  'arrow-left': faArrowLeft,
  'arrow-right': faArrowRight,
  download: faDownload,
  upload: faUpload,
  plus: faPlus,
  xmark: faXmark,
  eye: faEye,
  'shield-halved': faShieldHalved,
  'graduation-cap': faGraduationCap,
  building: faBuilding,
  'chalkboard-user': faChalkboardUser,
  'user-graduate': faUserGraduate,
  'file-csv': faFileCsv,
  'ranking-star': faRankingStar,
  trophy: faTrophy,
  briefcase: faBriefcase,
  'circle-check': faCircleCheck,
  'hourglass-half': faHourglassHalf,
  'indian-rupee-sign': faIndianRupeeSign,
  'triangle-exclamation': faTriangleExclamation,
  'chart-line': faChartLine,
  'arrow-up': faArrowUp,
  'arrow-down': faArrowDown,
  rotate: faRotate,
  'user-xmark': faUserXmark,
  pen: faPen,
  'floppy-disk': faFloppyDisk,
  search: faSearch,
  filter: faFilter,
  home: faHome,
  info: faInfoCircle,
};

export default function Icon({ name, style, className }) {
  const icon = ICONS[name];
  if (!icon) return <span>{name}</span>;
  return <FontAwesomeIcon icon={icon} style={style} className={className} />;
}
