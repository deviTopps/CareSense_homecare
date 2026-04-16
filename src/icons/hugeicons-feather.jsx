import { HugeiconsIcon } from '@hugeicons/react';
import {
  ActivityIcon,
  Add01Icon,
  Alert01Icon,
  AlertCircleIcon,
  AnalyticsUpIcon,
  ArrowDown01Icon,
  ArrowDownIcon,
  ArrowLeft01Icon,
  ArrowLeftDoubleIcon,
  ArrowLeftIcon,
  ArrowRight01Icon,
  ArrowRightDoubleIcon,
  ArrowRightIcon,
  ArrowUp01Icon,
  ArrowUpIcon,
  AwardIcon,
  BarChartIcon,
  CalendarIcon,
  CallIcon,
  CameraIcon,
  Cancel01Icon,
  CancelCircleIcon,
  CheckmarkCircle01Icon,
  ClipboardIcon,
  Clock01Icon,
  CreditCardIcon,
  Delete02Icon,
  Download01Icon,
  Edit02Icon,
  Edit03Icon,
  EditIcon,
  EyeIcon,
  FavouriteIcon,
  File02Icon,
  FilterIcon,
  FlagIcon,
  GlobeIcon,
  GridIcon,
  HelpCircleIcon,
  InformationCircleIcon,
  LeftToRightListBulletIcon,
  LockIcon,
  Logout01Icon,
  Mail01Icon,
  MapPinIcon,
  MehIcon,
  Menu01Icon,
  MenuIcon,
  MessageCircleReplyIcon,
  MessageSquareCodeIcon,
  MoreHorizontalIcon,
  Notification01Icon,
  PrinterIcon,
  RefreshIcon,
  RepeatIcon,
  Sad01Icon,
  SaveIcon,
  Search01Icon,
  SentIcon,
  Settings01Icon,
  Shield01Icon,
  SmartPhone01Icon,
  SmileIcon,
  StarIcon,
  ThermometerIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
  Tick01Icon,
  Upload01Icon,
  UserAdd01Icon,
  UserGroupIcon,
  UserIcon,
  UserMinusIcon,
  ViewOffIcon,
} from '@hugeicons/core-free-icons';

const iconMap = {
  FiActivity: ActivityIcon,
  FiAlertCircle: AlertCircleIcon,
  FiAlertTriangle: Alert01Icon,
  FiArrowDown: ArrowDownIcon,
  FiArrowLeft: ArrowLeftIcon,
  FiArrowRight: ArrowRightIcon,
  FiArrowUp: ArrowUpIcon,
  FiAward: AwardIcon,
  FiBarChart2: BarChartIcon,
  FiBell: Notification01Icon,
  FiCalendar: CalendarIcon,
  FiCamera: CameraIcon,
  FiCheck: Tick01Icon,
  FiCheckCircle: CheckmarkCircle01Icon,
  FiChevronDown: ArrowDown01Icon,
  FiChevronLeft: ArrowLeft01Icon,
  FiChevronRight: ArrowRight01Icon,
  FiChevronUp: ArrowUp01Icon,
  FiChevronsLeft: ArrowLeftDoubleIcon,
  FiChevronsRight: ArrowRightDoubleIcon,
  FiClipboard: ClipboardIcon,
  FiClock: Clock01Icon,
  FiCreditCard: CreditCardIcon,
  FiDownload: Download01Icon,
  FiEdit: EditIcon,
  FiEdit2: Edit02Icon,
  FiEdit3: Edit03Icon,
  FiEye: EyeIcon,
  FiEyeOff: ViewOffIcon,
  FiFileText: File02Icon,
  FiFilter: FilterIcon,
  FiFlag: FlagIcon,
  FiFrown: Sad01Icon,
  FiGlobe: GlobeIcon,
  FiGrid: GridIcon,
  FiHeart: FavouriteIcon,
  FiHelpCircle: HelpCircleIcon,
  FiInfo: InformationCircleIcon,
  FiList: LeftToRightListBulletIcon,
  FiLock: LockIcon,
  FiLogOut: Logout01Icon,
  FiMail: Mail01Icon,
  FiMapPin: MapPinIcon,
  FiMeh: MehIcon,
  FiMenu: MenuIcon,
  FiMessageCircle: MessageCircleReplyIcon,
  FiMessageSquare: MessageSquareCodeIcon,
  FiMoreHorizontal: MoreHorizontalIcon,
  FiPhone: CallIcon,
  FiPlus: Add01Icon,
  FiPrinter: PrinterIcon,
  FiRefreshCw: RefreshIcon,
  FiRepeat: RepeatIcon,
  FiSave: SaveIcon,
  FiSearch: Search01Icon,
  FiSend: SentIcon,
  FiSettings: Settings01Icon,
  FiShield: Shield01Icon,
  FiSmartphone: SmartPhone01Icon,
  FiSmile: SmileIcon,
  FiStar: StarIcon,
  FiThermometer: ThermometerIcon,
  FiThumbsDown: ThumbsDownIcon,
  FiThumbsUp: ThumbsUpIcon,
  FiTrash2: Delete02Icon,
  FiTrendingUp: AnalyticsUpIcon,
  FiUpload: Upload01Icon,
  FiUser: UserIcon,
  FiUserMinus: UserMinusIcon,
  FiUserPlus: UserAdd01Icon,
  FiUsers: UserGroupIcon,
  FiX: Cancel01Icon,
  FiXCircle: CancelCircleIcon,
};

function createIcon(name) {
  return function IconCompat({ size = 16, color = 'currentColor', strokeWidth = 1.8, ...rest }) {
    return <HugeiconsIcon icon={iconMap[name] || Menu01Icon} size={size} color={color} strokeWidth={strokeWidth} {...rest} />;
  };
}

export const FiActivity = createIcon('FiActivity');
export const FiAlertCircle = createIcon('FiAlertCircle');
export const FiAlertTriangle = createIcon('FiAlertTriangle');
export const FiArrowDown = createIcon('FiArrowDown');
export const FiArrowLeft = createIcon('FiArrowLeft');
export const FiArrowRight = createIcon('FiArrowRight');
export const FiArrowUp = createIcon('FiArrowUp');
export const FiAward = createIcon('FiAward');
export const FiBarChart2 = createIcon('FiBarChart2');
export const FiBell = createIcon('FiBell');
export const FiCalendar = createIcon('FiCalendar');
export const FiCamera = createIcon('FiCamera');
export const FiCheck = createIcon('FiCheck');
export const FiCheckCircle = createIcon('FiCheckCircle');
export const FiChevronDown = createIcon('FiChevronDown');
export const FiChevronLeft = createIcon('FiChevronLeft');
export const FiChevronRight = createIcon('FiChevronRight');
export const FiChevronUp = createIcon('FiChevronUp');
export const FiChevronsLeft = createIcon('FiChevronsLeft');
export const FiChevronsRight = createIcon('FiChevronsRight');
export const FiClipboard = createIcon('FiClipboard');
export const FiClock = createIcon('FiClock');
export const FiCreditCard = createIcon('FiCreditCard');
export const FiDownload = createIcon('FiDownload');
export const FiEdit = createIcon('FiEdit');
export const FiEdit2 = createIcon('FiEdit2');
export const FiEdit3 = createIcon('FiEdit3');
export const FiEye = createIcon('FiEye');
export const FiEyeOff = createIcon('FiEyeOff');
export const FiFileText = createIcon('FiFileText');
export const FiFilter = createIcon('FiFilter');
export const FiFlag = createIcon('FiFlag');
export const FiFrown = createIcon('FiFrown');
export const FiGlobe = createIcon('FiGlobe');
export const FiGrid = createIcon('FiGrid');
export const FiHeart = createIcon('FiHeart');
export const FiHelpCircle = createIcon('FiHelpCircle');
export const FiInfo = createIcon('FiInfo');
export const FiList = createIcon('FiList');
export const FiLock = createIcon('FiLock');
export const FiLogOut = createIcon('FiLogOut');
export const FiMail = createIcon('FiMail');
export const FiMapPin = createIcon('FiMapPin');
export const FiMeh = createIcon('FiMeh');
export const FiMenu = createIcon('FiMenu');
export const FiMessageCircle = createIcon('FiMessageCircle');
export const FiMessageSquare = createIcon('FiMessageSquare');
export const FiMoreHorizontal = createIcon('FiMoreHorizontal');
export const FiPhone = createIcon('FiPhone');
export const FiPlus = createIcon('FiPlus');
export const FiPrinter = createIcon('FiPrinter');
export const FiRefreshCw = createIcon('FiRefreshCw');
export const FiRepeat = createIcon('FiRepeat');
export const FiSave = createIcon('FiSave');
export const FiSearch = createIcon('FiSearch');
export const FiSend = createIcon('FiSend');
export const FiSettings = createIcon('FiSettings');
export const FiShield = createIcon('FiShield');
export const FiSmartphone = createIcon('FiSmartphone');
export const FiSmile = createIcon('FiSmile');
export const FiStar = createIcon('FiStar');
export const FiThermometer = createIcon('FiThermometer');
export const FiThumbsDown = createIcon('FiThumbsDown');
export const FiThumbsUp = createIcon('FiThumbsUp');
export const FiTrash2 = createIcon('FiTrash2');
export const FiTrendingUp = createIcon('FiTrendingUp');
export const FiUpload = createIcon('FiUpload');
export const FiUser = createIcon('FiUser');
export const FiUserMinus = createIcon('FiUserMinus');
export const FiUserPlus = createIcon('FiUserPlus');
export const FiUsers = createIcon('FiUsers');
export const FiX = createIcon('FiX');
export const FiXCircle = createIcon('FiXCircle');
