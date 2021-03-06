import currencyMap from './currency-map';

import IndexController from './controllers/index'
import ServiceListController from './controllers/service-list';
import ServiceDetailsController from './controllers/service-details';
import LocationController from './controllers/location';
import DateTimeController from './controllers/date-time';
import OrderConfirmController from './controllers/order-confirm';
import OrderDetailsController from './controllers/order-details';
import HistoryController from './controllers/history';

const { f7, t7 } = window.tommy.app;

// == Router
f7.onPageInit('nurse_booking__index', IndexController.init)
f7.onPageBeforeRemove('nurse_booking__index', IndexController.uninit)

f7.onPageInit('nurse_booking__service-list', ServiceListController.init)
f7.onPageBeforeRemove('nurse_booking__service-list', ServiceListController.uninit)

f7.onPageInit('nurse_booking__service-details', ServiceDetailsController.init)
f7.onPageBeforeRemove('nurse_booking__service-details', ServiceDetailsController.uninit)

f7.onPageInit('nurse_booking__location', LocationController.init)
f7.onPageBeforeRemove('nurse_booking__location', LocationController.uninit)

f7.onPageInit('nurse_booking__date-time', DateTimeController.init)
f7.onPageBeforeRemove('nurse_booking__date-time', DateTimeController.uninit)

f7.onPageInit('nurse_booking__order-confirm', OrderConfirmController.init)
f7.onPageBeforeAnimation('nurse_booking__order-confirm', OrderConfirmController.onBeforeIn)
f7.onPageBeforeRemove('nurse_booking__order-confirm', OrderConfirmController.uninit)

f7.onPageInit('nurse_booking__order-details', OrderDetailsController.init)
f7.onPageBeforeRemove('nurse_booking__order-details', OrderDetailsController.uninit)

f7.onPageInit('nurse_booking__history', HistoryController.init)
f7.onPageBeforeRemove('nurse_booking__history', HistoryController.uninit)

t7.registerHelper('nurse_booking__currencySymbol', code => {
  return currencyMap(code);
});

