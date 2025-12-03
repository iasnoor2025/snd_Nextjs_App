import { drizzle } from 'drizzle-orm/postgres-js';
import { locations } from './schema';
import postgres from 'postgres';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Comprehensive Saudi Arabia locations data with ALL coordinates
const saudiLocationsComprehensive = [
  // Major Cities and Regional Capitals
  { name: 'Riyadh', city: 'Riyadh', state: 'Riyadh Region', country: 'Saudi Arabia', description: 'Capital city of Saudi Arabia', latitude: '24.7136', longitude: '46.6753' },
  { name: 'Jeddah', city: 'Jeddah', state: 'Makkah Region', country: 'Saudi Arabia', description: 'Major port city on the Red Sea', latitude: '21.4858', longitude: '39.1925' },
  { name: 'Mecca', city: 'Mecca', state: 'Makkah Region', country: 'Saudi Arabia', description: 'Holiest city in Islam', latitude: '21.3891', longitude: '39.8579' },
  { name: 'Medina', city: 'Medina', state: 'Al Madinah Region', country: 'Saudi Arabia', description: 'Second holiest city in Islam', latitude: '24.5247', longitude: '39.5692' },
  { name: 'Dammam', city: 'Dammam', state: 'Eastern Province', country: 'Saudi Arabia', description: 'Capital of Eastern Province', latitude: '26.3927', longitude: '49.9777' },
  { name: 'Al Khobar', city: 'Al Khobar', state: 'Eastern Province', country: 'Saudi Arabia', description: 'Major city in Eastern Province', latitude: '26.2172', longitude: '50.1971' },
  { name: 'Dhahran', city: 'Dhahran', state: 'Eastern Province', country: 'Saudi Arabia', description: 'Oil industry center', latitude: '26.2361', longitude: '50.1014' },
  { name: 'Jubail', city: 'Jubail', state: 'Eastern Province', country: 'Saudi Arabia', description: 'Industrial city', latitude: '27.0174', longitude: '49.6603' },
  { name: 'Abha', city: 'Abha', state: 'Asir Region', country: 'Saudi Arabia', description: 'Capital of Asir Region', latitude: '18.2164', longitude: '42.5048' },
  { name: 'Tabuk', city: 'Tabuk', state: 'Tabuk Region', country: 'Saudi Arabia', description: 'Capital of Tabuk Region', latitude: '28.3998', longitude: '36.5700' },
  { name: 'Hail', city: 'Hail', state: 'Hail Region', country: 'Saudi Arabia', description: 'Capital of Hail Region', latitude: '27.5114', longitude: '41.6900' },
  { name: 'Najran', city: 'Najran', state: 'Najran Region', country: 'Saudi Arabia', description: 'Capital of Najran Region', latitude: '17.4924', longitude: '44.1277' },
  { name: 'Jizan', city: 'Jizan', state: 'Jizan Region', country: 'Saudi Arabia', description: 'Capital of Jizan Region', latitude: '16.8892', longitude: '42.5511' },
  { name: 'Al Baha', city: 'Al Baha', state: 'Al Baha Region', country: 'Saudi Arabia', description: 'Capital of Al Baha Region', latitude: '20.0129', longitude: '41.4677' },
  { name: 'Al Jouf', city: 'Al Jouf', state: 'Al Jouf Region', country: 'Saudi Arabia', description: 'Capital of Al Jouf Region', latitude: '29.7859', longitude: '40.2099' },
  { name: 'Arar', city: 'Arar', state: 'Northern Borders Region', country: 'Saudi Arabia', description: 'Capital of Northern Borders Region', latitude: '30.9753', longitude: '41.0381' },
  { name: 'Buraidah', city: 'Buraidah', state: 'Qassim Region', country: 'Saudi Arabia', description: 'Capital of Qassim Region', latitude: '26.3260', longitude: '43.9750' },
  
  // Additional Major Cities with Coordinates
  { name: 'Taif', city: 'Taif', state: 'Makkah Region', country: 'Saudi Arabia', description: 'Mountain city and summer resort', latitude: '21.2703', longitude: '40.4158' },
  { name: 'Yanbu', city: 'Yanbu', state: 'Al Madinah Region', country: 'Saudi Arabia', description: 'Industrial port city', latitude: '24.0896', longitude: '38.0618' },
  { name: 'Rabigh', city: 'Rabigh', state: 'Makkah Region', country: 'Saudi Arabia', description: 'Coastal city', latitude: '22.7981', longitude: '39.0348' },
  { name: 'Al Lith', city: 'Al Lith', state: 'Makkah Region', country: 'Saudi Arabia', description: 'Coastal city', latitude: '20.1633', longitude: '40.2889' },
  { name: 'Al Qunfudhah', city: 'Al Qunfudhah', state: 'Makkah Region', country: 'Saudi Arabia', description: 'Coastal city', latitude: '19.1269', longitude: '41.0789' },
  { name: 'Baljurashi', city: 'Baljurashi', state: 'Al Baha Region', country: 'Saudi Arabia', description: 'Historic city', latitude: '19.8500', longitude: '41.5667' },
  { name: 'Al Mikhwah', city: 'Al Mikhwah', state: 'Al Baha Region', country: 'Saudi Arabia', description: 'Mountain city', latitude: '19.2167', longitude: '41.6333' },
  { name: 'Al Aqiq', city: 'Al Aqiq', state: 'Al Baha Region', country: 'Saudi Arabia', description: 'Valley city', latitude: '19.6333', longitude: '41.5500' },
  { name: 'Unaizah', city: 'Unaizah', state: 'Qassim Region', country: 'Saudi Arabia', description: 'Historic city', latitude: '26.0833', longitude: '43.9833' },
  { name: 'Riyadh Al Khabra', city: 'Riyadh Al Khabra', state: 'Qassim Region', country: 'Saudi Arabia', description: 'Agricultural city', latitude: '25.4833', longitude: '43.9667' },
  { name: 'Al Bukayriyah', city: 'Al Bukayriyah', state: 'Qassim Region', country: 'Saudi Arabia', description: 'Agricultural city', latitude: '26.1333', longitude: '43.6500' },
  { name: 'Al Badayea', city: 'Al Badayea', state: 'Qassim Region', country: 'Saudi Arabia', description: 'Agricultural city', latitude: '26.8000', longitude: '43.3667' },
  { name: 'Al Asyah', city: 'Al Asyah', state: 'Qassim Region', country: 'Saudi Arabia', description: 'Agricultural city', latitude: '26.5167', longitude: '43.2667' },
  { name: 'Al Mithnab', city: 'Al Mithnab', state: 'Qassim Region', country: 'Saudi Arabia', description: 'Agricultural city', latitude: '25.8667', longitude: '44.2167' },
  { name: 'Al Shinan', city: 'Al Shinan', state: 'Qassim Region', country: 'Saudi Arabia', description: 'Agricultural city', latitude: '26.5167', longitude: '44.2167' },
  { name: 'Al Rass', city: 'Al Rass', state: 'Qassim Region', country: 'Saudi Arabia', description: 'Agricultural city', latitude: '25.8667', longitude: '43.5000' },
  
  // Riyadh Region Cities and Districts with Coordinates
  { name: 'Al Zulfi', city: 'Al Zulfi', state: 'Riyadh Region', country: 'Saudi Arabia', description: 'Agricultural city', latitude: '26.3000', longitude: '44.8000' },
  { name: 'Al Majmaah', city: 'Al Majmaah', state: 'Riyadh Region', country: 'Saudi Arabia', description: 'Agricultural city', latitude: '25.9000', longitude: '45.3500' },
  { name: 'Al Ghat', city: 'Al Ghat', state: 'Riyadh Region', country: 'Saudi Arabia', description: 'Mountain city', latitude: '26.1500', longitude: '44.4667' },
  { name: 'Al Diriyah', city: 'Al Diriyah', state: 'Riyadh Region', country: 'Saudi Arabia', description: 'Historic capital', latitude: '24.7333', longitude: '46.5833' },
  { name: 'Al Kharj', city: 'Al Kharj', state: 'Riyadh Region', country: 'Saudi Arabia', description: 'Agricultural city', latitude: '24.1500', longitude: '47.3000' },
  { name: 'Al Dawadmi', city: 'Al Dawadmi', state: 'Riyadh Region', country: 'Saudi Arabia', description: 'Agricultural city', latitude: '24.5000', longitude: '44.3833' },
  { name: 'Al Afif', city: 'Al Afif', state: 'Riyadh Region', country: 'Saudi Arabia', description: 'Agricultural city', latitude: '23.9167', longitude: '42.9167' },
  { name: 'Al Sulayyil', city: 'Al Sulayyil', state: 'Riyadh Region', country: 'Saudi Arabia', description: 'Agricultural city', latitude: '20.4667', longitude: '45.5667' },
  { name: 'Al Aflaj', city: 'Al Aflaj', state: 'Riyadh Region', country: 'Saudi Arabia', description: 'Agricultural city', latitude: '22.3000', longitude: '46.7167' },
  { name: 'Al Quwayiyah', city: 'Al Quwayiyah', state: 'Riyadh Region', country: 'Saudi Arabia', description: 'Agricultural city', latitude: '24.0667', longitude: '45.2833' },
  { name: 'Al Harmah', city: 'Al Harmah', state: 'Riyadh Region', country: 'Saudi Arabia', description: 'Agricultural city', latitude: '25.9333', longitude: '45.3333' },
  { name: 'Al Duwadimi', city: 'Al Duwadimi', state: 'Riyadh Region', country: 'Saudi Arabia', description: 'Agricultural city', latitude: '24.5000', longitude: '44.3833' },
  
  // Eastern Province Cities with Coordinates
  { name: 'Al Ahsa', city: 'Al Ahsa', state: 'Eastern Province', country: 'Saudi Arabia', description: 'Oasis city', latitude: '25.3833', longitude: '49.5833' },
  { name: 'Hofuf', city: 'Hofuf', state: 'Eastern Province', country: 'Saudi Arabia', description: 'Historic city', latitude: '25.3833', longitude: '49.5833' },
  { name: 'Al Mubarraz', city: 'Al Mubarraz', state: 'Eastern Province', country: 'Saudi Arabia', description: 'Agricultural city', latitude: '25.4000', longitude: '49.5667' },
  { name: 'Ras Tanura', city: 'Ras Tanura', state: 'Eastern Province', country: 'Saudi Arabia', description: 'Oil terminal city', latitude: '26.6333', longitude: '50.1500' },
  { name: 'Al Khafji', city: 'Al Khafji', state: 'Eastern Province', country: 'Saudi Arabia', description: 'Border city', latitude: '28.4333', longitude: '48.5000' },
  { name: 'Al Nairyah', city: 'Al Nairyah', state: 'Eastern Province', country: 'Saudi Arabia', description: 'Agricultural city', latitude: '27.4667', longitude: '45.9667' },
  { name: 'Al Qatif', city: 'Al Qatif', state: 'Eastern Province', country: 'Saudi Arabia', description: 'Historic city', latitude: '26.5667', longitude: '49.9833' },
  { name: 'Al Safwa', city: 'Al Safwa', state: 'Eastern Province', country: 'Saudi Arabia', description: 'Industrial city', latitude: '26.6500', longitude: '49.9500' },
  
  // Asir Region Cities with Coordinates
  { name: 'Khamis Mushait', city: 'Khamis Mushait', state: 'Asir Region', country: 'Saudi Arabia', description: 'Military city', latitude: '18.3000', longitude: '42.7333' },
  { name: 'Bisha', city: 'Bisha', state: 'Asir Region', country: 'Saudi Arabia', description: 'Agricultural city', latitude: '19.9833', longitude: '42.6000' },
  { name: 'Al Namas', city: 'Al Namas', state: 'Asir Region', country: 'Saudi Arabia', description: 'Mountain city', latitude: '19.1500', longitude: '42.1167' },
  { name: 'Al Majardah', city: 'Al Majardah', state: 'Asir Region', country: 'Saudi Arabia', description: 'Mountain city', latitude: '19.1167', longitude: '42.1333' },
  { name: 'Al Harith', city: 'Al Harith', state: 'Asir Region', country: 'Saudi Arabia', description: 'Mountain city', latitude: '19.6333', longitude: '42.9667' },
  
  // Tabuk Region Cities with Coordinates
  { name: 'Al Wajh', city: 'Al Wajh', state: 'Tabuk Region', country: 'Saudi Arabia', description: 'Coastal city', latitude: '26.2333', longitude: '36.4667' },
  { name: 'Duba', city: 'Duba', state: 'Tabuk Region', country: 'Saudi Arabia', description: 'Coastal city', latitude: '27.3500', longitude: '35.7000' },
  { name: 'Haql', city: 'Haql', state: 'Tabuk Region', country: 'Saudi Arabia', description: 'Border city', latitude: '29.2833', longitude: '34.9333' },
  { name: 'Al Bad', city: 'Al Bad', state: 'Tabuk Region', country: 'Saudi Arabia', description: 'Historic city', latitude: '28.4000', longitude: '35.8000' },
  { name: 'Tayma', city: 'Tayma', state: 'Tabuk Region', country: 'Saudi Arabia', description: 'Historic oasis', latitude: '27.6333', longitude: '38.5500' },
  { name: 'Al Ula', city: 'Al Ula', state: 'Tabuk Region', country: 'Saudi Arabia', description: 'Archaeological site', latitude: '26.6167', longitude: '37.9167' },
  { name: 'Khaybar', city: 'Khaybar', state: 'Tabuk Region', country: 'Saudi Arabia', description: 'Historic city', latitude: '25.6833', longitude: '39.2833' },
  { name: 'Sakaka', city: 'Sakaka', state: 'Al Jouf Region', country: 'Saudi Arabia', description: 'Regional capital', latitude: '29.9697', longitude: '40.2000' },
  { name: 'Qurayyat', city: 'Qurayyat', state: 'Al Jouf Region', country: 'Saudi Arabia', description: 'Border city', latitude: '31.3333', longitude: '37.3333' },
  { name: 'Dumat Al Jandal', city: 'Dumat Al Jandal', state: 'Al Jouf Region', country: 'Saudi Arabia', description: 'Historic city', latitude: '29.8167', longitude: '39.8667' },
  
  // Hail Region Cities with Coordinates
  { name: 'Al Baqaa', city: 'Al Baqaa', state: 'Hail Region', country: 'Saudi Arabia', description: 'Agricultural city', latitude: '27.6333', longitude: '41.7167' },
  { name: 'Al Hazm', city: 'Al Hazm', state: 'Hail Region', country: 'Saudi Arabia', description: 'Agricultural city', latitude: '27.8000', longitude: '41.9167' },
  { name: 'Al Shuaib', city: 'Al Shuaib', state: 'Hail Region', country: 'Saudi Arabia', description: 'Agricultural city', latitude: '27.9667', longitude: '42.1167' },
  { name: 'Al Qassim', city: 'Al Qassim', state: 'Hail Region', country: 'Saudi Arabia', description: 'Agricultural city', latitude: '27.8000', longitude: '42.1167' },
  
  // Najran Region Cities with Coordinates
  { name: 'Sharurah', city: 'Sharurah', state: 'Najran Region', country: 'Saudi Arabia', description: 'Border city', latitude: '17.4667', longitude: '47.1167' },
  { name: 'Al Kharkhir', city: 'Al Kharkhir', state: 'Najran Region', country: 'Saudi Arabia', description: 'Border city', latitude: '17.6333', longitude: '47.2167' },
  { name: 'Al Wadiah', city: 'Al Wadiah', state: 'Najran Region', country: 'Saudi Arabia', description: 'Border city', latitude: '17.8000', longitude: '47.3167' },
  
  // Jizan Region Cities with Coordinates
  { name: 'Abu Arish', city: 'Abu Arish', state: 'Jizan Region', country: 'Saudi Arabia', description: 'Coastal city', latitude: '16.9667', longitude: '42.8333' },
  { name: 'Al Ahad', city: 'Al Ahad', state: 'Jizan Region', country: 'Saudi Arabia', description: 'Coastal city', latitude: '16.8333', longitude: '42.9500' },
  { name: 'Al Aridah', city: 'Al Aridah', state: 'Jizan Region', country: 'Saudi Arabia', description: 'Coastal city', latitude: '16.7000', longitude: '43.0667' },
  { name: 'Al Dayer', city: 'Al Dayer', state: 'Jizan Region', country: 'Saudi Arabia', description: 'Coastal city', latitude: '16.5667', longitude: '43.1833' },
  { name: 'Al Reeth', city: 'Al Reeth', state: 'Jizan Region', country: 'Saudi Arabia', description: 'Coastal city', latitude: '16.4333', longitude: '43.3000' },
  { name: 'Al Sabya', city: 'Al Sabya', state: 'Jizan Region', country: 'Saudi Arabia', description: 'Coastal city', latitude: '16.3000', longitude: '43.4167' },
  { name: 'Al Tuhal', city: 'Al Tuhal', state: 'Jizan Region', country: 'Saudi Arabia', description: 'Coastal city', latitude: '16.1667', longitude: '43.5333' },
  { name: 'Al Udayn', city: 'Al Udayn', state: 'Jizan Region', country: 'Saudi Arabia', description: 'Coastal city', latitude: '16.0333', longitude: '43.6500' },
  { name: 'Al Wadeen', city: 'Al Wadeen', state: 'Jizan Region', country: 'Saudi Arabia', description: 'Coastal city', latitude: '15.9000', longitude: '43.7667' },
  { name: 'Al Zahir', city: 'Al Zahir', state: 'Jizan Region', country: 'Saudi Arabia', description: 'Coastal city', latitude: '15.7667', longitude: '43.8833' },
  { name: 'Al Zubair', city: 'Al Zubair', state: 'Jizan Region', country: 'Saudi Arabia', description: 'Coastal city', latitude: '15.6333', longitude: '44.0000' },
  
  // Major Districts and Areas in Riyadh with Coordinates
  { name: 'King Fahd District', city: 'Riyadh', state: 'Riyadh Region', country: 'Saudi Arabia', description: 'Central business district', latitude: '24.7136', longitude: '46.6753' },
  { name: 'Olaya District', city: 'Riyadh', state: 'Riyadh Region', country: 'Saudi Arabia', description: 'Commercial and residential area', latitude: '24.7136', longitude: '46.6753' },
  { name: 'King Abdullah Financial District', city: 'Riyadh', state: 'Riyadh Region', country: 'Saudi Arabia', description: 'Financial center', latitude: '24.7136', longitude: '46.6753' },
  { name: 'King Salman Energy Park', city: 'Riyadh', state: 'Riyadh Region', country: 'Saudi Arabia', description: 'Energy industry hub', latitude: '24.7136', longitude: '46.6753' },
  { name: 'King Khalid International Airport', city: 'Riyadh', state: 'Riyadh Region', country: 'Saudi Arabia', description: 'Main airport', latitude: '24.9583', longitude: '46.6989' },
  
  // Major Districts in Jeddah with Coordinates
  { name: 'Al Balad', city: 'Jeddah', state: 'Makkah Region', country: 'Saudi Arabia', description: 'Historic district', latitude: '21.4858', longitude: '39.1925' },
  { name: 'Corniche', city: 'Jeddah', state: 'Makkah Region', country: 'Saudi Arabia', description: 'Coastal area', latitude: '21.4858', longitude: '39.1925' },
  { name: 'King Abdulaziz International Airport', city: 'Jeddah', state: 'Makkah Region', country: 'Saudi Arabia', description: 'Main airport', latitude: '21.6800', longitude: '39.1500' },
  { name: 'King Abdullah Economic City', city: 'Jeddah', state: 'Makkah Region', country: 'Saudi Arabia', description: 'Economic development zone', latitude: '22.5000', longitude: '39.1000' },
  
  // Major Districts in Dammam with Coordinates
  { name: 'Al Faisaliyah', city: 'Dammam', state: 'Eastern Province', country: 'Saudi Arabia', description: 'Central district', latitude: '26.3927', longitude: '49.9777' },
  { name: 'King Fahd International Airport', city: 'Dammam', state: 'Eastern Province', country: 'Saudi Arabia', description: 'Main airport', latitude: '26.4711', longitude: '49.7978' },
  { name: 'King Abdulaziz Port', city: 'Dammam', state: 'Eastern Province', country: 'Saudi Arabia', description: 'Major port', latitude: '26.3927', longitude: '49.9777' },
  
  // Industrial Cities with Coordinates
  { name: 'King Abdullah Economic City', city: 'Rabigh', state: 'Makkah Region', country: 'Saudi Arabia', description: 'Mega economic city', latitude: '22.7981', longitude: '39.0348' },
  { name: 'NEOM', city: 'Tabuk', state: 'Tabuk Region', country: 'Saudi Arabia', description: 'Future smart city', latitude: '28.3998', longitude: '36.5700' },
  { name: 'Jazan Economic City', city: 'Jazan', state: 'Jazan Region', country: 'Saudi Arabia', description: 'Economic development zone', latitude: '16.8892', longitude: '42.5511' },
  
  // Religious Sites with Coordinates
  { name: 'Masjid al-Haram', city: 'Mecca', state: 'Makkah Region', country: 'Saudi Arabia', description: 'Grand Mosque', latitude: '21.4225', longitude: '39.8262' },
  { name: 'Masjid an-Nabawi', city: 'Medina', state: 'Al Madinah Region', country: 'Saudi Arabia', description: 'Prophet\'s Mosque', latitude: '24.4672', longitude: '39.6111' },
  { name: 'Mount Arafat', city: 'Mecca', state: 'Makkah Region', country: 'Saudi Arabia', description: 'Pilgrimage site', latitude: '21.3500', longitude: '39.9833' },
  { name: 'Mina', city: 'Mecca', state: 'Makkah Region', country: 'Saudi Arabia', description: 'Pilgrimage site', latitude: '21.4000', longitude: '39.9000' },
  { name: 'Muzdalifah', city: 'Mecca', state: 'Makkah Region', country: 'Saudi Arabia', description: 'Pilgrimage site', latitude: '21.4000', longitude: '39.9000' },
  
  // Universities and Educational Institutions with Coordinates
  { name: 'King Saud University', city: 'Riyadh', state: 'Riyadh Region', country: 'Saudi Arabia', description: 'Major university', latitude: '24.7136', longitude: '46.6753' },
  { name: 'King Abdulaziz University', city: 'Jeddah', state: 'Makkah Region', country: 'Saudi Arabia', description: 'Major university', latitude: '21.4858', longitude: '39.1925' },
  { name: 'King Fahd University of Petroleum and Minerals', city: 'Dhahran', state: 'Eastern Province', country: 'Saudi Arabia', description: 'Petroleum university', latitude: '26.2361', longitude: '50.1014' },
  { name: 'King Abdullah University of Science and Technology', city: 'Thuwal', state: 'Makkah Region', country: 'Saudi Arabia', description: 'Research university', latitude: '22.3000', longitude: '39.1000' },
  
  // Ports and Airports with Coordinates
  { name: 'Jeddah Islamic Port', city: 'Jeddah', state: 'Makkah Region', country: 'Saudi Arabia', description: 'Major port', latitude: '21.4858', longitude: '39.1925' },
  
  // Tourist and Cultural Sites with Coordinates
  { name: 'Al Masmak Fortress', city: 'Riyadh', state: 'Riyadh Region', country: 'Saudi Arabia', description: 'Historic fortress', latitude: '24.7136', longitude: '46.6753' },
  { name: 'National Museum', city: 'Riyadh', state: 'Riyadh Region', country: 'Saudi Arabia', description: 'National museum', latitude: '24.7136', longitude: '46.6753' },
  { name: 'Al Balad Historic District', city: 'Jeddah', state: 'Makkah Region', country: 'Saudi Arabia', description: 'UNESCO World Heritage site', latitude: '21.4858', longitude: '39.1925' },
  { name: 'Edge of the World', city: 'Riyadh', state: 'Riyadh Region', country: 'Saudi Arabia', description: 'Natural landmark', latitude: '24.7136', longitude: '46.6753' },
  { name: 'Al Wahba Crater', city: 'Taif', state: 'Makkah Region', country: 'Saudi Arabia', description: 'Natural landmark', latitude: '21.2703', longitude: '40.4158' },
  
  // Major Shopping and Entertainment with Coordinates
  { name: 'Kingdom Centre', city: 'Riyadh', state: 'Riyadh Region', country: 'Saudi Arabia', description: 'Shopping mall and landmark', latitude: '24.7136', longitude: '46.6753' },
  { name: 'Al Faisaliyah Centre', city: 'Riyadh', state: 'Riyadh Region', country: 'Saudi Arabia', description: 'Shopping mall', latitude: '24.7136', longitude: '46.6753' },
  { name: 'Red Sea Mall', city: 'Jeddah', state: 'Makkah Region', country: 'Saudi Arabia', description: 'Shopping mall', latitude: '21.4858', longitude: '39.1925' },
  { name: 'Mall of Arabia', city: 'Jeddah', state: 'Makkah Region', country: 'Saudi Arabia', description: 'Shopping mall', latitude: '21.4858', longitude: '39.1925' },
  
  // Healthcare Facilities with Coordinates
  { name: 'King Faisal Specialist Hospital', city: 'Riyadh', state: 'Riyadh Region', country: 'Saudi Arabia', description: 'Specialist hospital', latitude: '24.7136', longitude: '46.6753' },
  { name: 'King Fahd Medical City', city: 'Riyadh', state: 'Riyadh Region', country: 'Saudi Arabia', description: 'Medical complex', latitude: '24.7136', longitude: '46.6753' },
  { name: 'King Abdulaziz Medical City', city: 'Jeddah', state: 'Makkah Region', country: 'Saudi Arabia', description: 'Medical complex', latitude: '21.4858', longitude: '39.1925' },
  
  // Government and Administrative with Coordinates
  { name: 'King Abdulaziz Palace', city: 'Riyadh', state: 'Riyadh Region', country: 'Saudi Arabia', description: 'Royal palace', latitude: '24.7136', longitude: '46.6753' },
  { name: 'Ministry of Interior', city: 'Riyadh', state: 'Riyadh Region', country: 'Saudi Arabia', description: 'Government ministry', latitude: '24.7136', longitude: '46.6753' },
  { name: 'Saudi Central Bank', city: 'Riyadh', state: 'Riyadh Region', country: 'Saudi Arabia', description: 'Central bank', latitude: '24.7136', longitude: '46.6753' },
  { name: 'Saudi Stock Exchange', city: 'Riyadh', state: 'Riyadh Region', country: 'Saudi Arabia', description: 'Stock exchange', latitude: '24.7136', longitude: '46.6753' },
  
  // Additional Villages and Towns - Riyadh Region
  { name: 'Al Thumamah', city: 'Riyadh', state: 'Riyadh Region', country: 'Saudi Arabia', description: 'Village near Riyadh', latitude: '25.0000', longitude: '46.5000' },
  { name: 'Al Hayer', city: 'Riyadh', state: 'Riyadh Region', country: 'Saudi Arabia', description: 'Agricultural village', latitude: '24.8000', longitude: '46.8000' },
  { name: 'Al Salil', city: 'Al Salil', state: 'Riyadh Region', country: 'Saudi Arabia', description: 'Mountain village', latitude: '23.5000', longitude: '46.8000' },
  { name: 'Al Huraymila', city: 'Al Huraymila', state: 'Riyadh Region', country: 'Saudi Arabia', description: 'Historic town', latitude: '25.1333', longitude: '46.1167' },
  
  // Additional Villages and Towns - Makkah Region
  { name: 'Al Jumum', city: 'Al Jumum', state: 'Makkah Region', country: 'Saudi Arabia', description: 'Agricultural village', latitude: '21.6167', longitude: '39.7000' },
  
  // Additional Villages and Towns - Northern Borders Region
  { name: 'Al Uwayqilah', city: 'Al Uwayqilah', state: 'Northern Borders Region', country: 'Saudi Arabia', description: 'Border village', latitude: '30.5000', longitude: '41.5000' },
  { name: 'Al Rafha', city: 'Al Rafha', state: 'Northern Borders Region', country: 'Saudi Arabia', description: 'Agricultural village', latitude: '30.8000', longitude: '41.2000' },
  
  // Additional Villages and Towns - Al Baha Region
  { name: 'Al Mandaq', city: 'Al Mandaq', state: 'Al Baha Region', country: 'Saudi Arabia', description: 'Mountain village', latitude: '20.3000', longitude: '41.3000' },
  { name: 'Al Qara', city: 'Al Qara', state: 'Al Baha Region', country: 'Saudi Arabia', description: 'Mountain village', latitude: '20.5000', longitude: '41.4000' },
  
  // Additional Villages and Towns - Al Madinah Region
  { name: 'Al Henakiyah', city: 'Al Henakiyah', state: 'Al Madinah Region', country: 'Saudi Arabia', description: 'Agricultural village', latitude: '24.5000', longitude: '38.5000' },
  { name: 'Al Ula', city: 'Al Ula', state: 'Al Madinah Region', country: 'Saudi Arabia', description: 'Archaeological village', latitude: '26.6167', longitude: '37.9167' },
  { name: 'Khaybar', city: 'Khaybar', state: 'Al Madinah Region', country: 'Saudi Arabia', description: 'Historic village', latitude: '25.6833', longitude: '39.2833' },
  
  // Additional Villages and Towns - Eastern Province
  { name: 'Al Jubail', city: 'Al Jubail', state: 'Eastern Province', country: 'Saudi Arabia', description: 'Industrial village', latitude: '27.0174', longitude: '49.6603' },
  { name: 'Al Khafji', city: 'Al Khafji', state: 'Eastern Province', country: 'Saudi Arabia', description: 'Border village', latitude: '28.4333', longitude: '48.5000' },
  
  // Additional Villages and Towns - Asir Region
  { name: 'Al Rijal Alma', city: 'Al Rijal Alma', state: 'Asir Region', country: 'Saudi Arabia', description: 'Mountain village', latitude: '18.5000', longitude: '42.5000' },
  { name: 'Al Namas', city: 'Al Namas', state: 'Asir Region', country: 'Saudi Arabia', description: 'Mountain village', latitude: '19.1500', longitude: '42.1167' },
  
  // Additional Villages and Towns - Tabuk Region
  { name: 'Al Wajh', city: 'Al Wajh', state: 'Tabuk Region', country: 'Saudi Arabia', description: 'Coastal village', latitude: '26.2333', longitude: '36.4667' },
  { name: 'Duba', city: 'Duba', state: 'Tabuk Region', country: 'Saudi Arabia', description: 'Coastal village', latitude: '27.3500', longitude: '35.7000' },
  { name: 'Haql', city: 'Haql', state: 'Tabuk Region', country: 'Saudi Arabia', description: 'Border village', latitude: '29.2833', longitude: '34.9333' },
  { name: 'Al Bad', city: 'Al Bad', state: 'Tabuk Region', country: 'Saudi Arabia', description: 'Historic village', latitude: '28.4000', longitude: '35.8000' },
  { name: 'Tayma', city: 'Tayma', state: 'Tabuk Region', country: 'Saudi Arabia', description: 'Historic oasis village', latitude: '27.6333', longitude: '38.5500' },
  
  // Additional Villages and Towns - Al Jouf Region
  { name: 'Sakaka', city: 'Sakaka', state: 'Al Jouf Region', country: 'Saudi Arabia', description: 'Regional capital', latitude: '29.9697', longitude: '40.2000' },
  { name: 'Qurayyat', city: 'Qurayyat', state: 'Al Jouf Region', country: 'Saudi Arabia', description: 'Border town', latitude: '31.3333', longitude: '37.3333' },
  { name: 'Dumat Al Jandal', city: 'Dumat Al Jandal', state: 'Al Jouf Region', country: 'Saudi Arabia', description: 'Historic village', latitude: '29.8167', longitude: '39.8667' },
  
  // Additional Villages and Towns - Hail Region
  { name: 'Al Baqaa', city: 'Al Baqaa', state: 'Hail Region', country: 'Saudi Arabia', description: 'Agricultural village', latitude: '27.6333', longitude: '41.7167' },
  { name: 'Al Hazm', city: 'Al Hazm', state: 'Hail Region', country: 'Saudi Arabia', description: 'Agricultural village', latitude: '27.8000', longitude: '41.9167' },
  { name: 'Al Shuaib', city: 'Al Shuaib', state: 'Hail Region', country: 'Saudi Arabia', description: 'Agricultural village', latitude: '27.9667', longitude: '42.1167' },
  { name: 'Al Qassim', city: 'Al Qassim', state: 'Hail Region', country: 'Saudi Arabia', description: 'Agricultural village', latitude: '27.8000', longitude: '42.1167' },
  
  // Additional Villages and Towns - Najran Region
  { name: 'Sharurah', city: 'Sharurah', state: 'Najran Region', country: 'Saudi Arabia', description: 'Border village', latitude: '17.4667', longitude: '47.1167' },
  { name: 'Al Kharkhir', city: 'Al Kharkhir', state: 'Najran Region', country: 'Saudi Arabia', description: 'Border village', latitude: '17.6333', longitude: '47.2167' },
  { name: 'Al Wadiah', city: 'Al Wadiah', state: 'Najran Region', country: 'Saudi Arabia', description: 'Border village', latitude: '17.8000', longitude: '47.3167' },
  
  // Additional Villages and Towns - Jizan Region
  { name: 'Abu Arish', city: 'Abu Arish', state: 'Jizan Region', country: 'Saudi Arabia', description: 'Coastal village', latitude: '16.9667', longitude: '42.8333' },
  { name: 'Al Ahad', city: 'Al Ahad', state: 'Jizan Region', country: 'Saudi Arabia', description: 'Coastal village', latitude: '16.8333', longitude: '42.9500' },
  { name: 'Al Aridah', city: 'Al Aridah', state: 'Jizan Region', country: 'Saudi Arabia', description: 'Coastal village', latitude: '16.7000', longitude: '43.0667' },
  { name: 'Al Dayer', city: 'Al Dayer', state: 'Jizan Region', country: 'Saudi Arabia', description: 'Coastal village', latitude: '16.5667', longitude: '43.1833' },
  { name: 'Al Reeth', city: 'Al Reeth', state: 'Jizan Region', country: 'Saudi Arabia', description: 'Coastal village', latitude: '16.4333', longitude: '43.3000' },
  { name: 'Al Sabya', city: 'Al Sabya', state: 'Jizan Region', country: 'Saudi Arabia', description: 'Coastal village', latitude: '16.3000', longitude: '43.4167' },
  { name: 'Al Tuhal', city: 'Al Tuhal', state: 'Jizan Region', country: 'Saudi Arabia', description: 'Coastal village', latitude: '16.1667', longitude: '43.5333' },
  { name: 'Al Udayn', city: 'Al Udayn', state: 'Jizan Region', country: 'Saudi Arabia', description: 'Coastal village', latitude: '16.0333', longitude: '43.6500' },
  { name: 'Al Wadeen', city: 'Al Wadeen', state: 'Jizan Region', country: 'Saudi Arabia', description: 'Coastal village', latitude: '15.9000', longitude: '43.7667' },
  { name: 'Al Zahir', city: 'Al Zahir', state: 'Jizan Region', country: 'Saudi Arabia', description: 'Coastal village', latitude: '15.7667', longitude: '43.8833' },
  { name: 'Al Zubair', city: 'Al Zubair', state: 'Jizan Region', country: 'Saudi Arabia', description: 'Coastal village', latitude: '15.6333', longitude: '44.0000' }
];

export async function seedSaudiLocationsComprehensive() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const client = postgres(connectionString);
  const db = drizzle(client);

  try {
    console.log('Starting to seed comprehensive Saudi Arabia locations...');
    
    for (const location of saudiLocationsComprehensive) {
      await db.insert(locations).values({
        name: location.name,
        description: location.description,
        city: location.city,
        state: location.state,
        country: location.country,
        latitude: parseFloat(location.latitude),
        longitude: parseFloat(location.longitude),
        isActive: true,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0]
      });
    }
    
    console.log(`Successfully seeded ${saudiLocationsComprehensive.length} comprehensive Saudi Arabia locations`);
  } catch (error) {
    console.error('Error seeding comprehensive locations:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedSaudiLocationsComprehensive()
    .then(() => {
      console.log('Comprehensive seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Comprehensive seeding failed:', error);
      process.exit(1);
    });
}
