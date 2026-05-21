import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  ShoppingBag, 
  Check, 
  MapPin, 
  Clock, 
  Utensils, 
  Smartphone, 
  Plus, 
  Minus, 
  Trash2, 
  Settings, 
  AlertTriangle, 
  CreditCard, 
  Lock, 
  CheckCircle, 
  Calendar, 
  ChevronRight, 
  Info, 
  X, 
  Map,
  BadgeAlert,
  ArrowRight,
  Sparkles,
  DollarSign,
  Edit3,
  FolderPlus,
  QrCode,
  Ticket,
  Bike,
  ChefHat,
  Bell,
  Zap,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { INITIAL_MENU, INITIAL_TABLES, ADICIONES_LIST, HOLIDAYS, CIENAGA_ZONES } from './data';
import { Product, Category, CartItem, CustomerInfo, TableConfig, DeliveryZone, ActiveOrder, CouponConfig, DailySchedule } from './types';
import { db, auth, loginWithGoogle, logoutAdmin, testFirestoreConnection } from './firebase';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';

const DEFAULT_WEEKLY_SCHEDULE: DailySchedule[] = [
  { dayIndex: 0, dayLabel: 'Domingo', closed: false, openTime: '17:00', closeTime: '23:00' },
  { dayIndex: 1, dayLabel: 'Lunes', closed: true, openTime: '17:00', closeTime: '22:30' },
  { dayIndex: 2, dayLabel: 'Martes', closed: false, openTime: '17:00', closeTime: '22:30' },
  { dayIndex: 3, dayLabel: 'Miércoles', closed: false, openTime: '17:00', closeTime: '22:30' },
  { dayIndex: 4, dayLabel: 'Jueves', closed: false, openTime: '17:00', closeTime: '22:30' },
  { dayIndex: 5, dayLabel: 'Viernes', closed: false, openTime: '17:00', closeTime: '23:00' },
  { dayIndex: 6, dayLabel: 'Sábado', closed: false, openTime: '17:00', closeTime: '23:00' }
];

export default function App() {
  // --- Persistent & Local States ---
  // Firebase Auth and real-time syncing states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [syncedAdminPassword, setSyncedAdminPassword] = useState<string>('');
  const [weeklySchedule, setWeeklySchedule] = useState<DailySchedule[]>(() => {
    try {
      const saved = localStorage.getItem('lp_schedule');
      return saved ? JSON.parse(saved) : DEFAULT_WEEKLY_SCHEDULE;
    } catch {
      return DEFAULT_WEEKLY_SCHEDULE;
    }
  });

  const [menu, setMenu] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem('lp_menu');
      return saved ? JSON.parse(saved) : INITIAL_MENU;
    } catch {
      return INITIAL_MENU;
    }
  });

  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  
  const [custInfo, setCustInfo] = useState<CustomerInfo>(() => {
    try {
      const saved = localStorage.getItem('lp_cust');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      name: '',
      phone: '',
      mesa: 'Mesa 1 (Central)',
      addr: '',
      ot: 'mesa',
      pay: 'Efectivo',
    };
  });

  // --- Promo state ---
  const [promoText, setPromoText] = useState(() => localStorage.getItem('lp_promo') || '🔥 ¡Gran Apertura! Recibe 10% de descuento automático pidiendo para mesa hoy mismo.');
  const [promoOn, setPromoOn] = useState(() => localStorage.getItem('lp_promoOn') !== 'false');

  // --- UI Toggles ---
  const [cartOpen, setCartOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminPasswordError, setAdminPasswordError] = useState(false);

  // --- Modal Config ---
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const [modalCategory, setModalCategory] = useState<string>('');
  const [modalQty, setModalQty] = useState(1);
  const [modalNote, setModalNote] = useState('');
  const [selectedAdditions, setSelectedAdditions] = useState<{ name: string; price: number }[]>([]);

  // --- Table states ---
  const [selectedTableId, setSelectedTableId] = useState('1');

  // --- Search active ---
  const [searchCount, setSearchCount] = useState(0);

  // --- Simulated Location Geocoding ---
  const [distanceKm, setDistanceKm] = useState<number>(0);
  const [deliveryCost, setDeliveryCost] = useState<number>(3000);
  const [geocodingMsg, setGeocodingMsg] = useState<string>('');
  const [selectedZoneId, setSelectedZoneId] = useState<string>(() => {
    return localStorage.getItem('lp_zone_id') || 'cerca';
  });
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [isGpsUsed, setIsGpsUsed] = useState(false);

  // --- Toasts state ---
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'info' | 'error' }[]>([]);

  // --- Coupon Codes Engine ---
  const [coupons, setCoupons] = useState<CouponConfig[]>(() => {
    try {
      const saved = localStorage.getItem('lp_coupons');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      { code: 'PREFERIDA10', type: 'percent', value: 10, active: true },
      { code: 'CIENAGAFREE', type: 'free_shipping', value: 0, active: true },
      { code: 'REGALOPRE', type: 'fixed', value: 5000, active: true }
    ];
  });
  
  const [couponInput, setCouponInput] = useState('');
  
  // Custom coupon creation form states
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState<'percent' | 'fixed' | 'free_shipping' | 'bogo' | 'specific_product'>('percent');
  const [newCouponValue, setNewCouponValue] = useState(0);
  const [newCouponBogoBuyQty, setNewCouponBogoBuyQty] = useState(2);
  const [newCouponBogoFreeQty, setNewCouponBogoFreeQty] = useState(1);
  const [newCouponSpecificProdId, setNewCouponSpecificProdId] = useState('');
  const [newCouponSpecificProdDiscType, setNewCouponSpecificProdDiscType] = useState<'percent' | 'fixed'>('percent');

  const [appliedCoupon, setAppliedCoupon] = useState<CouponConfig | null>(() => {
    try {
      const saved = localStorage.getItem('lp_applied_coupon');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // --- Interactive QR Table Simulator ---
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [qrScanning, setQrScanning] = useState(false);

  // --- Live Simulated Order Tracker ---
  const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(() => {
    try {
      const saved = localStorage.getItem('lp_active_order');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [trackerOpen, setTrackerOpen] = useState(() => {
    try {
      const savedOrder = localStorage.getItem('lp_active_order');
      return savedOrder ? true : false;
    } catch {
      return false;
    }
  });

  // --- Admin Section adds ---
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdIng, setNewProdIng] = useState('');
  const [newProdCatId, setNewProdCatId] = useState('entradas');

  // --- Logo image error handler ---
  const [logoErr, setLogoErr] = useState(false);

  // --- Category Addition States ---
  const [newCatName, setNewCatName] = useState('');
  const [newCatNote, setNewCatNote] = useState('');

  // --- Product Modification States ---
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [editingProductCatId, setEditingProductCatId] = useState<string>('');
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editIng, setEditIng] = useState('');
  const [editCatId, setEditCatId] = useState('');

  const [activePromoDraft, setActivePromoDraft] = useState(promoText);
  const [adminMenuVersion, setAdminMenuVersion] = useState(0);

  // --- Restaurant Schedule & Timing ---
  const [restaurantOpen, setRestaurantOpen] = useState(true);
  const [scheduleTodayMsg, setScheduleTodayMsg] = useState('');
  const [nextOpeningMsg, setNextOpeningMsg] = useState('');

  // --- References ---
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Trigger toast helper
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  // --- CLOUD SYNC & FIREBASE REALTIME LISTENERS ---
  // Monitor auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Check connection initially
  useEffect(() => {
    // Basic connectivity trace
    const checkConn = async () => {
      try {
        const { testFirestoreConnection } = await import('./firebase');
        testFirestoreConnection();
      } catch (err) {
        console.warn('Trace connection failed:', err);
      }
    };
    checkConn();
  }, []);

  // Listen to digital menu real-time from Firestore
  useEffect(() => {
    const docRef = doc(db, 'config', 'menu');
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && data.categories) {
          setMenu(data.categories);
        }
      }
    }, (error) => {
      console.error('Firestore subscription error for config/menu:', error);
    });
    return () => unsubscribe();
  }, []);

  // Listen to coupons real-time from Firestore
  useEffect(() => {
    const docRef = doc(db, 'config', 'coupons');
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && data.coupons) {
          setCoupons(data.coupons);
        }
      }
    }, (error) => {
      console.error('Firestore subscription error for config/coupons:', error);
    });
    return () => unsubscribe();
  }, []);

  // Listen to general settings / announcements real-time from Firestore
  useEffect(() => {
    const docRef = doc(db, 'config', 'settings');
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data) {
          if (data.promoText !== undefined) {
            setPromoText(data.promoText);
            setActivePromoDraft(data.promoText);
          }
          if (data.promoOn !== undefined) {
            setPromoOn(data.promoOn);
          }
          if (data.adminPassword !== undefined) {
            setSyncedAdminPassword(data.adminPassword);
          }
          if (data.schedule !== undefined) {
            setWeeklySchedule(data.schedule);
            localStorage.setItem('lp_schedule', JSON.stringify(data.schedule));
          }
        }
      }
    }, (error) => {
      console.error('Firestore subscription error for config/settings:', error);
    });
    return () => unsubscribe();
  }, []);

  // Sync helpers to update states locally & push to cloud if authenticated as admin
  const updateMenuState = async (updatedMenu: Category[]) => {
    if (auth.currentUser?.email === 'lapreferidarestaurante2025@gmail.com') {
      try {
        await setDoc(doc(db, 'config', 'menu'), { categories: updatedMenu });
      } catch (err) {
        console.error('Failed to sync menu to Firestore:', err);
        setMenu(updatedMenu);
        setAdminMenuVersion(prev => prev + 1);
      }
    } else {
      setMenu(updatedMenu);
      setAdminMenuVersion(prev => prev + 1);
    }
  };

  const updateCouponsState = async (updatedCoupons: CouponConfig[]) => {
    if (auth.currentUser?.email === 'lapreferidarestaurante2025@gmail.com') {
      try {
        await setDoc(doc(db, 'config', 'coupons'), { coupons: updatedCoupons });
      } catch (err) {
        console.error('Failed to sync coupons to Firestore:', err);
        setCoupons(updatedCoupons);
      }
    } else {
      setCoupons(updatedCoupons);
    }
  };

  const updateSettingsState = async (newText: string, newOn: boolean, newPass?: string, newSchedule?: DailySchedule[]) => {
    const backupPass = localStorage.getItem('lp_pw') || '1234';
    const finalPass = newPass || syncedAdminPassword || backupPass;
    const finalSchedule = newSchedule || weeklySchedule;
    if (auth.currentUser?.email === 'lapreferidarestaurante2025@gmail.com') {
      try {
        await setDoc(doc(db, 'config', 'settings'), { 
          promoText: newText, 
          promoOn: newOn, 
          adminPassword: finalPass,
          schedule: finalSchedule 
        });
      } catch (err) {
        console.error('Failed to sync settings to Firestore:', err);
        setPromoText(newText);
        setPromoOn(newOn);
        if (newPass) localStorage.setItem('lp_pw', newPass);
        if (newSchedule) {
          setWeeklySchedule(newSchedule);
          localStorage.setItem('lp_schedule', JSON.stringify(newSchedule));
        }
      }
    } else {
      setPromoText(newText);
      setPromoOn(newOn);
      if (newPass) localStorage.setItem('lp_pw', newPass);
      if (newSchedule) {
        setWeeklySchedule(newSchedule);
        localStorage.setItem('lp_schedule', JSON.stringify(newSchedule));
      }
    }
  };

  // Google sign in / auth handler matching lapreferidarestaurante2025@gmail.com
  const handleGoogleLogin = async () => {
    try {
      const user = await loginWithGoogle();
      if (user.email === 'lapreferidarestaurante2025@gmail.com') {
        setAdminOpen(true);
        setPwOpen(false);
        showToast('🔓 Sincronización en la Nube Activa (Conectado)', 'success');
        
        // Seed database collections on very first sign-in if they are empty
        const menuDoc = await getDoc(doc(db, 'config', 'menu'));
        if (!menuDoc.exists()) {
          await setDoc(doc(db, 'config', 'menu'), { categories: menu });
        }
        const couponsDoc = await getDoc(doc(db, 'config', 'coupons'));
        if (!couponsDoc.exists()) {
          await setDoc(doc(db, 'config', 'coupons'), { coupons: coupons });
        }
        const settingsDoc = await getDoc(doc(db, 'config', 'settings'));
        if (!settingsDoc.exists()) {
          await setDoc(doc(db, 'config', 'settings'), { 
            promoText: promoText, 
            promoOn: promoOn,
            adminPassword: localStorage.getItem('lp_pw') || '1234',
            schedule: weeklySchedule
          });
        }
      } else {
        await logoutAdmin();
        showToast('Acceso Denegado: Su cuenta no está autorizada para administrar ⚠️', 'error');
      }
    } catch (e) {
      showToast('Error de autenticación con Google', 'error');
    }
  };

  // Synchronize localStorage
  useEffect(() => {
    localStorage.setItem('lp_menu', JSON.stringify(menu));
  }, [menu, adminMenuVersion]);

  useEffect(() => {
    localStorage.setItem('lp_cust', JSON.stringify(custInfo));
  }, [custInfo]);

  useEffect(() => {
    localStorage.setItem('lp_zone_id', selectedZoneId);
  }, [selectedZoneId]);

  useEffect(() => {
    localStorage.setItem('lp_coupons', JSON.stringify(coupons));
  }, [coupons]);

  useEffect(() => {
    if (appliedCoupon) {
      localStorage.setItem('lp_applied_coupon', JSON.stringify(appliedCoupon));
    } else {
      localStorage.removeItem('lp_applied_coupon');
    }
  }, [appliedCoupon]);

  useEffect(() => {
    if (!activeOrder || activeOrder.step >= 3) return;

    const interval = setInterval(() => {
      setActiveOrder(prevOrder => {
        if (!prevOrder) return null;
        if (prevOrder.step >= 3) {
          clearInterval(interval);
          return prevOrder;
        }
        const nextStep = prevOrder.step + 1;
        const updated = { ...prevOrder, step: nextStep };
        localStorage.setItem('lp_active_order', JSON.stringify(updated));

        const deliverMsgs = [
          '🍳 ¡En Cocina! La cocina de La Preferida está preparando tu plato con amor.',
          '🏍️ ¡En Camino! El domiciliario va volando con tu pedido caliente.',
          '🎉 ¡Entregado! Pedido en tus manos. ¡Muchas gracias por tu preferencia!'
        ];
        
        const dineInMsgs = [
          '🍳 ¡En Parrilla! El asador de La Preferida está dándole el punto a tu pedido.',
          '🍽️ ¡Servido! Tus platos han sido servidos calientes en tu mesa.',
          '🎉 ¡Buen Provecho! Disfruta la experiencia gastronómica cienaguera.'
        ];

        const takeOutMsgs = [
          '🍳 ¡Preparando! Tu pedido se encuentra en ensamblaje y empaque.',
          '🛍️ ¡Listo para Retirar! Pasa por la registradora para reclamar tu pedido.',
          '🎉 ¡Retirado! Disfruta tu comida de La Preferida en casa.'
        ];

        const list = prevOrder.type === 'mesa' ? dineInMsgs : prevOrder.type === 'llevar' ? takeOutMsgs : deliverMsgs;
        const noteMsg = list[nextStep - 1];
        if (noteMsg) {
          showToast(noteMsg, 'success');
        }

        return updated;
      });
    }, 22000); // Progress tracker state every 22 seconds for realism

    return () => clearInterval(interval);
  }, [activeOrder]);

  // Handle business schedule
  useEffect(() => {
    const isHoliday = () => {
      const todayString = new Date().toISOString().slice(0, 10);
      return HOLIDAYS.includes(todayString);
    };

    const getSchedFor = (dow: number, holiday: boolean) => {
      const sched = weeklySchedule.find(s => s.dayIndex === dow);
      if (!sched || sched.closed) return null;

      const [oH, oM] = (sched.openTime || '17:00').split(':').map(Number);
      const [cH, cM] = (sched.closeTime || '22:30').split(':').map(Number);

      return { o: oH * 60 + oM, c: cH * 60 + cM };
    };

    const formatTo12 = (min: number) => {
      const h = Math.floor(min / 60);
      const m = min % 60;
      const ampm = h >= 12 ? 'PM' : 'AM';
      const hours12 = h % 12 || 12;
      return `${hours12}:${m.toString().padStart(2, '0')} ${ampm}`;
    };

    const updateRestaurantStatus = () => {
      const now = new Date();
      const dow = now.getDay();
      const currentMinute = now.getHours() * 60 + now.getMinutes();
      const holiday = isHoliday();
      const currentSched = getSchedFor(dow, holiday);

      const openStatus = currentSched ? currentMinute >= currentSched.o && currentMinute < currentSched.c : false;
      setRestaurantOpen(openStatus);

      if (currentSched) {
        setScheduleTodayMsg(`Hoy Abierto: ${formatTo12(currentSched.o)} - ${formatTo12(currentSched.c)}`);
      } else {
        const sched = weeklySchedule.find(s => s.dayIndex === dow);
        setScheduleTodayMsg(`Hoy ${sched?.dayLabel || 'Lunes'}: Cerrado por descanso`);
      }

      // Proxima apertura text logic
      if (!openStatus) {
        if (currentSched && currentMinute < currentSched.o) {
          setNextOpeningMsg(`Abrimos hoy a las ${formatTo12(currentSched.o)}`);
        } else {
          // Look ahead to check the next opening day
          const daysOfWeek = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
          let foundNext = false;
          for (let i = 1; i <= 7; i++) {
            const nextDow = (dow + i) % 7;
            const nextSched = getSchedFor(nextDow, false);
            if (nextSched) {
              setNextOpeningMsg(`Abrimos el próximo ${daysOfWeek[nextDow]} a las ${formatTo12(nextSched.o)}`);
              foundNext = true;
              break;
            }
          }
          if (!foundNext) {
            setNextOpeningMsg('Cerrado por el momento');
          }
        }
      } else {
        setNextOpeningMsg('');
      }
    };

    updateRestaurantStatus();
    const interval = setInterval(updateRestaurantStatus, 15000);
    return () => clearInterval(interval);
  }, [weeklySchedule]);

  // Set default initial category
  useEffect(() => {
    if (menu.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(menu[0].id);
    }
  }, [menu, selectedCategoryId]);

  // Haversine formula to calculate actual distance between GPS coordinates
  const getDistanceInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(2));
  };

  // Triggers GPS geolocation automatically and calculates exact delivery cost
  const handleGeolocateCustomer = () => {
    if (!navigator.geolocation) {
      setGpsError('La geolocalización no está soportada por tu navegador.');
      return;
    }
    setGpsLoading(true);
    setGpsError('');

    // La Preferida located roughly at Calle 7, Plaza Centenario, Ciénaga (11.00692, -74.24976)
    const restLat = 11.00692;
    const restLng = -74.24976;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        const distance = getDistanceInKm(restLat, restLng, userLat, userLng);
        
        setDistanceKm(distance);
        setIsGpsUsed(true);

        if (distance <= 1.0) {
          setSelectedZoneId('cerca');
          setDeliveryCost(3000);
          showToast(`📍 GPS: Ubicación detectada a ${distance} km. Tarifa: Cerca ($3.000 COP).`, 'success');
        } else {
          setSelectedZoneId('lejos');
          setDeliveryCost(4000);
          showToast(`📍 GPS: Ubicación detectada a ${distance} km. Tarifa: Lejos ($4.000 COP).`, 'success');
        }
        setGpsLoading(false);
      },
      (error) => {
        console.error('Error de geolocalización:', error);
        let errorMsg = 'No pudimos acceder a tu GPS. Por favor, selecciona tu sector en los botones.';
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = 'Permiso de GPS denegado. Por favor selecciona tu sector manualmente.';
        }
        setGpsError(errorMsg);
        setGpsLoading(false);
        showToast(errorMsg, 'error');
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  // Reset GPS flag if address text is cleared or manually edited
  const handleAddressChangeWithGpsReset = (val: string) => {
    setCustInfo({ ...custInfo, addr: val });
    if (isGpsUsed) {
      setIsGpsUsed(false);
    }
  };

  // Geocoding simulation based on zone and address in Ciénaga
  useEffect(() => {
    const addrText = custInfo.addr.trim();
    if (addrText.length < 5) {
      if (!isGpsUsed) {
        setDistanceKm(0);
      }
      const activeZone = CIENAGA_ZONES.find(z => z.id === selectedZoneId) || CIENAGA_ZONES[0];
      setDeliveryCost(activeZone.cost);
      setGeocodingMsg('');
      return;
    }

    if (isGpsUsed) {
      // If GPS coordinates were detected, use actual distance and cost of the selected zone!
      const activeZone = CIENAGA_ZONES.find(z => z.id === selectedZoneId) || CIENAGA_ZONES[0];
      setDeliveryCost(activeZone.cost);
      setGeocodingMsg(
        `Ubicación GPS precisa · ${activeZone.name} · Distancia: ~${distanceKm} km · Recargo: $${activeZone.cost.toLocaleString('es-CO')}`
      );
      return;
    }

    // Auto-detect zone if address contains specific landmark or peripheral barrio keyword patterns
    const addrLower = addrText.toLowerCase();
    let detectedZoneId = selectedZoneId;
    if (
      addrLower.includes('verde') || 
      addrLower.includes('miramar') || 
      addrLower.includes('kennedy') || 
      addrLower.includes('morro') || 
      addrLower.includes('mar de plata') ||
      addrLower.includes('cordoba') || 
      addrLower.includes('córdoba') || 
      addrLower.includes('alianza') || 
      addrLower.includes('nelson') || 
      addrLower.includes('maestre') || 
      addrLower.includes('san juan') || 
      addrLower.includes('progreso') ||
      addrLower.includes('floresta') || 
      addrLower.includes('bolsillo') || 
      addrLower.includes('milagrosa') || 
      addrLower.includes('18 de enero') || 
      addrLower.includes('alterna') || 
      addrLower.includes('nuevo') || 
      addrLower.includes('nueva') ||
      addrLower.includes('lejos') ||
      addrLower.includes('periferia') ||
      addrLower.includes('lejana')
    ) {
      detectedZoneId = 'lejos';
    } else {
      // Default to cerca (max 1.0 km @ $3,000) for standard addresses
      detectedZoneId = 'cerca';
    }

    if (detectedZoneId !== selectedZoneId) {
      setSelectedZoneId(detectedZoneId);
    }

    const currentZoneId = detectedZoneId;
    setGeocodingMsg('Buscando cobertura y calculando tarifa de reparto en Ciénaga...');

    const timer = setTimeout(() => {
      const len = addrText.length;
      const zone = CIENAGA_ZONES.find(z => z.id === currentZoneId) || CIENAGA_ZONES[0];

      // Computes a stable simulated distance within the zone's specific range
      let generatedDistance = 0.8;
      if (currentZoneId === 'cerca') {
        // Distance is strictly <= 1.0 km (0.4 to 0.95 km)
        generatedDistance = parseFloat((0.4 + (len % 6) * 0.10).toFixed(2));
      } else if (currentZoneId === 'lejos') {
        // Distance is strictly > 1.0 km (1.2 to 2.4 km)
        generatedDistance = parseFloat((1.2 + (len % 6) * 0.22).toFixed(2));
      }

      setDistanceKm(generatedDistance);
      setDeliveryCost(zone.cost);
      setGeocodingMsg(
        `Ubicación validada · ${zone.name} · Distancia aprox: ~${generatedDistance} km · Recargo: $${zone.cost.toLocaleString('es-CO')}`
      );
    }, 850);

    return () => clearTimeout(timer);
  }, [custInfo.addr, selectedZoneId, isGpsUsed, distanceKm]);

  // Reset category highlight during search action
  useEffect(() => {
    if (searchQuery.trim() !== '') {
      let count = 0;
      const query = searchQuery.toLowerCase();
      menu.forEach(cat => {
        cat.items.forEach(p => {
          if (
            p.name.toLowerCase().includes(query) ||
            p.desc.toLowerCase().includes(query) ||
            p.ing.some(i => i.toLowerCase().includes(query))
          ) {
            count++;
          }
        });
      });
      setSearchCount(count);
    }
  }, [searchQuery, menu]);

  // Add Item to cart helpers
  const handleAddItemToCartDirect = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!product.ok) {
      showToast('Este producto no está disponible por el momento', 'error');
      return;
    }

    const uniqueCartId = `${product.id}-direct`;
    const existing = cart.find(item => item.id === uniqueCartId);

    if (existing) {
      setCart(cart.map(item => item.id === uniqueCartId ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, {
        id: uniqueCartId,
        productId: product.id,
        name: product.name,
        price: product.price,
        qty: 1,
        note: '',
        adiciones: []
      }]);
    }
    showToast(`${product.name} agregado al pedido`, 'success');
  };

  const handleOpenProductModal = (product: Product, categoryName: string) => {
    setModalProduct(product);
    setModalCategory(categoryName);
    setModalQty(1);
    setModalNote('');
    setSelectedAdditions([]);
  };

  const handleAddModalToCart = () => {
    if (!modalProduct) return;

    const additionsPrice = selectedAdditions.reduce((sum, item) => sum + item.price, 0);
    const finalItemPrice = modalProduct.price + additionsPrice;
    
    // Build unique ID representing product, selections and customized instruction
    const additionsKey = selectedAdditions.map(a => a.name).sort().join(',');
    const uniqueCartId = `${modalProduct.id}-${additionsKey || 'none'}-${modalNote || 'none'}`;

    const existing = cart.find(item => item.id === uniqueCartId);
    if (existing) {
      setCart(cart.map(item => item.id === uniqueCartId ? { ...item, qty: item.qty + modalQty } : item));
    } else {
      setCart([...cart, {
        id: uniqueCartId,
        productId: modalProduct.id,
        name: modalProduct.name,
        price: finalItemPrice,
        qty: modalQty,
        note: modalNote,
        adiciones: selectedAdditions
      }]);
    }

    showToast(`${modalProduct.name} (x${modalQty}) agregado éxitosamente`, 'success');
    setModalProduct(null);
  };

  const toggleAdditionSelection = (add: { name: string; price: number }) => {
    const exists = selectedAdditions.find(item => item.name === add.name);
    if (exists) {
      setSelectedAdditions(selectedAdditions.filter(item => item.name !== add.name));
    } else {
      setSelectedAdditions([...selectedAdditions, add]);
    }
  };

  const updateCartQty = (id: string, newQty: number) => {
    if (newQty < 1) {
      setCart(cart.filter(item => item.id !== id));
      showToast('Producto eliminado del pedido', 'info');
    } else {
      setCart(cart.map(item => item.id === id ? { ...item, qty: newQty } : item));
    }
  };

  // Format order summary for WhatsApp message
  const handleSendToWhatsApp = () => {
    if (!custInfo.name.trim()) {
      showToast('Por favor, ingresa tu nombre en los datos de entrega', 'error');
      setCartOpen(true);
      return;
    }
    if (custInfo.ot === 'domicilio' && !custInfo.phone.trim()) {
      showToast('Se requiere un celular para el envío a domicilio', 'error');
      setCartOpen(true);
      return;
    }
    if (custInfo.ot === 'domicilio' && !custInfo.addr.trim()) {
      showToast('Por favor introduce tu dirección para el domicilio', 'error');
      setCartOpen(true);
      return;
    }
    if (cart.length === 0) {
      showToast('Tu carrito de compras está vacío', 'info');
      return;
    }

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const activeZone = CIENAGA_ZONES.find(z => z.id === selectedZoneId) || CIENAGA_ZONES[0];
    const orderTypeLabels = {
      mesa: `🍽️ En Mesa [${custInfo.mesa}]`,
      llevar: '🛍️ Para Llevar / Retiro',
      domicilio: `🚗 Domicilio a: ${custInfo.addr} [${activeZone.name.split('/')[0]?.trim() || activeZone.name}]`
    };

    // Coupon Calculations for WhatsApp
    const discountAmt = getDiscountAmt();
    const finalDeliveryCost = custInfo.ot === 'domicilio' ? (appliedCoupon?.type === 'free_shipping' ? 0 : deliveryCost) : 0;
    const finalTotal = Math.max(0, subtotal + finalDeliveryCost - discountAmt);

    let message = `🍔 *NUEVO PEDIDO - LA PREFERIDA* 🍔\n`;
    message += `----------------------------------------------\n`;
    message += `👤 *Cliente:* ${custInfo.name}\n`;
    if (custInfo.phone) message += `📞 *Teléfono:* ${custInfo.phone}\n`;
    message += `📍 *Servicio:* ${orderTypeLabels[custInfo.ot]}\n`;
    message += `💵 *Método de Pago:* ${custInfo.pay}\n`;
    message += `📅 *Fecha:* ${new Date().toLocaleDateString('es-CO')} · ${new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}\n`;
    message += `----------------------------------------------\n\n`;
    message += `🛒 *PRODUCTOS SOLICITADOS:*\n`;

    cart.forEach(item => {
      message += `• *${item.qty}x* ${item.name} ($${(item.price * item.qty).toLocaleString('es-CO')})\n`;
      if (item.adiciones.length > 0) {
        message += `  _Extras:_ ${item.adiciones.map(a => `${a.name} (+$${a.price})`).join(', ')}\n`;
      }
      if (item.note) {
        message += `  _Nota:_ "${item.note}"\n`;
      }
    });

    message += `\n----------------------------------------------\n`;
    message += `💵 *Subtotal:* $${subtotal.toLocaleString('es-CO')}\n`;
    if (custInfo.ot === 'domicilio') {
      if (appliedCoupon?.type === 'free_shipping') {
        message += `🚗 *Recargo Domicilio [${activeZone.name.split('/')[0]?.trim() || activeZone.name}]:* ¡Gratis por Código de Promoción! 🎉\n`;
      } else {
        message += `🚗 *Recargo Domicilio [${activeZone.name.split('/')[0]?.trim() || activeZone.name}]:* $${deliveryCost.toLocaleString('es-CO')}\n`;
      }
    }
    if (appliedCoupon && discountAmt > 0) {
      message += `🎟️ *Cupón Aplicado (${appliedCoupon.code}):* -$${discountAmt.toLocaleString('es-CO')}\n`;
    }
    message += `💰 *TOTAL A PAGAR: $${finalTotal.toLocaleString('es-CO')}*\n\n`;
    message += `¡Muchas gracias por su preferencia! Quedamos atentos de su confirmación de cocina. ✨`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappURL = `https://wa.me/573002589363?text=${encodedMessage}`;
    window.open(whatsappURL, '_blank');

    // Create the active tracker order representation
    const orderId = 'LP-' + Math.floor(1000 + Math.random() * 9000);
    const mockOrder: ActiveOrder = {
      id: orderId,
      time: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      itemsCount: cart.reduce((sum, item) => sum + item.qty, 0),
      subtotal,
      deliveryCost: finalDeliveryCost,
      discount: discountAmt,
      total: finalTotal,
      type: custInfo.ot,
      details: custInfo.ot === 'mesa' ? custInfo.mesa : custInfo.ot === 'domicilio' ? custInfo.addr : 'Retiro en local',
      payMethod: custInfo.pay,
      step: 0,
      customerName: custInfo.name
    };
    setActiveOrder(mockOrder);
    localStorage.setItem('lp_active_order', JSON.stringify(mockOrder));
    setTrackerOpen(true);

    // Save order history state to restore easily in current session if needed
    localStorage.setItem('lp_last_order', JSON.stringify(cart));
    showToast(`🛒 ¡Pedido enviado! Sigue el estado en tiempo real con el panel inferior de Entrega Local.`, 'success');
  };

  // Load previous order helper
  const handleLoadPreviousOrder = () => {
    try {
      const saved = localStorage.getItem('lp_last_order');
      if (saved) {
        setCart(JSON.parse(saved));
        showToast('Último pedido restaurado éticamente', 'success');
      } else {
        showToast('No tienes pedidos previos guardados aún en este navegador', 'info');
      }
    } catch {
      showToast('Error al recuperar historial', 'error');
    }
  };

  // Coupon promo control actions
  const handleApplyCoupon = () => {
    const codeClean = couponInput.trim().toUpperCase();
    if (!codeClean) return;
    const found = coupons.find(c => c.code === codeClean);
    if (!found) {
      showToast('Código de cupón inválido o inexistente 🎟️', 'error');
      return;
    }
    if (!found.active) {
      showToast('Este cupón se encuentra inactivo actualmente ⚠️', 'error');
      return;
    }
    setAppliedCoupon(found);
    setCouponInput('');
    showToast(`🎟️ ¡Cupón ${found.code} aplicado! Descuento activo en el resumen.`, 'success');
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    showToast('Cupón promocional removido de la orden', 'info');
  };

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = newCouponCode.trim().toUpperCase();
    if (!cleanCode) {
      showToast('Por favor escribe un código de cupón válido 🎟️', 'error');
      return;
    }

    if (coupons.some(c => c.code === cleanCode)) {
      showToast('Ya existe un cupón registrado con este código ⚠️', 'error');
      return;
    }

    // Build the coupon configuration based on type
    const newCoupon: CouponConfig = {
      code: cleanCode,
      type: newCouponType,
      value: (newCouponType === 'percent' || newCouponType === 'fixed' || newCouponType === 'specific_product') ? Number(newCouponValue) : 0,
      active: true,
      bogoBuyQty: newCouponType === 'bogo' ? Number(newCouponBogoBuyQty) : undefined,
      bogoFreeQty: newCouponType === 'bogo' ? Number(newCouponBogoFreeQty) : undefined,
      specificProductId: (newCouponType === 'specific_product' || newCouponType === 'bogo') ? (newCouponSpecificProdId || undefined) : undefined,
      specificProductDiscountType: newCouponType === 'specific_product' ? newCouponSpecificProdDiscType : undefined
    };

    updateCouponsState([...coupons, newCoupon]);
    showToast(`🎟️ Cupón "${cleanCode}" creado satisfactoriamente`, 'success');

    // Reset form states
    setNewCouponCode('');
    setNewCouponValue(0);
    setNewCouponBogoBuyQty(2);
    setNewCouponBogoFreeQty(1);
    setNewCouponSpecificProdId('');
  };

  const handleDeleteCoupon = (code: string) => {
    if (confirm(`¿Estás seguro de que deseas eliminar permanentemente el cupón "${code}"?`)) {
      updateCouponsState(coupons.filter(c => c.code !== code));
      if (appliedCoupon?.code === code) {
        setAppliedCoupon(null);
      }
      showToast(`🎟️ Cupón "${code}" eliminado`, 'info');
    }
  };

  const handleToggleCouponActive = (code: string) => {
    const updatedCoupons = coupons.map(c => {
      if (c.code === code) {
        const nextState = !c.active;
        if (!nextState && appliedCoupon?.code === code) {
          setAppliedCoupon(null);
        }
        return { ...c, active: nextState };
      }
      return c;
    });
    updateCouponsState(updatedCoupons);
    showToast(`Estado de cupón actualizado`, 'success');
  };

  // Trigger web simulation helper of tabletop QR scanning
  const handleSimulateQRScan = () => {
    setQrScannerOpen(true);
    setQrScanning(true);
    
    // Synthesize beep frequency using browser audio ecosystem
    setTimeout(() => {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(950, audioCtx.currentTime); // high target pitch
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        oscillator.start();
        setTimeout(() => {
          oscillator.stop();
          audioCtx.close();
        }, 120);
      } catch (err) {
        console.warn('Ecosistema de audio bloqueado o no soportado');
      }

      const randomTableIdx = Math.floor(Math.random() * INITIAL_TABLES.length);
      const matchedTable = INITIAL_TABLES[randomTableIdx];
      
      setCustInfo(prev => ({ 
        ...prev, 
        mesa: matchedTable.name,
        ot: 'mesa' 
      }));
      setQrScanning(false);
      showToast(`📸 QR Mesa Detectado: Mesa vinculada a ${matchedTable.name}!`, 'success');

      setTimeout(() => {
        setQrScannerOpen(false);
      }, 1000);
    }, 1600);
  };

  // Admin login process
  const checkAdminPassword = () => {
    const savedConfig = syncedAdminPassword || localStorage.getItem('lp_pw') || '1234';
    if (adminPassword === savedConfig) {
      setAdminOpen(true);
      setPwOpen(false);
      setAdminPassword('');
      setAdminPasswordError(false);
      showToast('Acceso Administrativo Concedido', 'success');
    } else {
      setAdminPasswordError(true);
      showToast('Contraseña incorrecta, vuelve a intentarlo', 'error');
    }
  };

  const handleSavePromo = () => {
    localStorage.setItem('lp_promo', activePromoDraft);
    updateSettingsState(activePromoDraft, promoOn);
    showToast('Banner promocional del día actualizado', 'success');
  };

  const handleTogglePromoOn = () => {
    const newValue = !promoOn;
    updateSettingsState(promoText, newValue);
    showToast(`Banner del día ${newValue ? 'activado' : 'desactivado'}`, 'info');
  };

  const handleChangePassword = (newPass: string) => {
    if (!newPass.trim()) {
      showToast('La nueva contraseña no puede estar en blanco', 'error');
      return;
    }
    updateSettingsState(promoText, promoOn, newPass.trim());
    showToast('Contraseña de administrador actualizada', 'success');
  };

  // Toggle item availability in menu
  const toggleProductAvailability = (catId: string, itemId: string) => {
    const updated = menu.map(cat => {
      if (cat.id === catId) {
        return {
          ...cat,
          items: cat.items.map(item => {
            if (item.id === itemId) {
              const prev = item.ok;
              showToast(`${item.name} ahora está ${!prev ? 'Disponible' : 'Pausado'}`, 'info');
              return { ...item, ok: !prev };
            }
            return item;
          })
        };
      }
      return cat;
    });
    updateMenuState(updated);
  };

  const deleteProductFromMenu = (catId: string, itemId: string) => {
    const updated = menu.map(cat => {
      if (cat.id === catId) {
        const itemToDelete = cat.items.find(i => i.id === itemId);
        showToast(`${itemToDelete?.name || 'Producto'} eliminado del menú`, 'error');
        return {
          ...cat,
          items: cat.items.filter(item => item.id !== itemId)
        };
      }
      return cat;
    });
    updateMenuState(updated);
  };

  const handlePriceChange = (catId: string, itemId: string, rawPrice: string) => {
    const priceNum = parseInt(rawPrice);
    if (isNaN(priceNum) || priceNum <= 0) return;

    const updated = menu.map(cat => {
      if (cat.id === catId) {
        return {
          ...cat,
          items: cat.items.map(item => {
            if (item.id === itemId) {
              return { ...item, price: priceNum };
            }
            return item;
          })
        };
      }
      return cat;
    });
    updateMenuState(updated);
  };

  // Add customized item into state
  const handleAddNewProductItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim() || !newProdPrice.trim()) {
      showToast('Por favor rellena el nombre y precio del plato', 'error');
      return;
    }

    const priceNum = parseInt(newProdPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      showToast('Ingresa un precio de venta numérico válido', 'error');
      return;
    }

    const ingredientsArr = newProdIng
      ? newProdIng.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    const newProd: Product = {
      id: `custom-${Date.now()}`,
      name: newProdName.trim(),
      price: priceNum,
      desc: newProdDesc.trim() || 'Exquisito plato elaborado al instante por nuestros chefs.',
      ing: ingredientsArr.length > 0 ? ingredientsArr : ['Ingredientes frescos de alta calidad'],
      ok: true
    };

    const updated = menu.map(cat => {
      if (cat.id === newProdCatId) {
        return {
          ...cat,
          items: [...cat.items, newProd]
        };
      }
      return cat;
    });

    updateMenuState(updated);

    // Reset forms
    setNewProdName('');
    setNewProdPrice('');
    setNewProdDesc('');
    setNewProdIng('');
    showToast(`El plato "${newProd.name}" se creó y publicó exitosamente`, 'success');
  };

  // Add new category dynamically
  const handleAddNewCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      showToast('Por favor, ingresa el nombre de la categoría', 'error');
      return;
    }

    const cleanId = newCatName
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove latin accents
      .replace(/[^a-z0-9 ]/g, '') // remove special chars
      .replace(/\s+/g, '-'); // spaces to dashes

    const categoryId = cleanId || `cat-${Date.now()}`;

    // check if exists
    if (menu.some(c => c.id === categoryId)) {
      showToast('Ya existe una categoría similar o con el mismo nombre', 'error');
      return;
    }

    const newCategory: Category = {
      id: categoryId,
      name: newCatName.trim(),
      note: newCatNote.trim(),
      items: []
    };

    updateMenuState([...menu, newCategory]);

    setNewCatName('');
    setNewCatNote('');
    showToast(`Categoría "${newCategory.name}" agregada exitosamente`, 'success');
  };

  // Start editing product helper
  const handleStartEditingProduct = (catId: string, item: Product) => {
    setEditingProduct(item);
    setEditingProductCatId(catId);
    setEditName(item.name);
    setEditPrice(String(item.price));
    setEditDesc(item.desc);
    setEditIng(item.ing.join(', '));
    setEditCatId(catId);
  };

  // Save product edits
  const handleSaveProductEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (!editName.trim() || !editPrice.trim()) {
      showToast('Ingresa un nombre y precio válidos', 'error');
      return;
    }
    const priceNum = parseInt(editPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      showToast('Precio debe ser de venta numérico positivo', 'error');
      return;
    }

    const ingredientsArr = editIng
      ? editIng.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    const updatedProduct: Product = {
      ...editingProduct,
      name: editName.trim(),
      price: priceNum,
      desc: editDesc.trim(),
      ing: ingredientsArr.length > 0 ? ingredientsArr : ['Ingredientes frescos de alta calidad'],
    };

    let updatedMenu = [...menu];

    // If category changed, move it from old category to new category
    if (editCatId !== editingProductCatId) {
      updatedMenu = updatedMenu.map(cat => {
        if (cat.id === editingProductCatId) {
          return {
            ...cat,
            items: cat.items.filter(i => i.id !== editingProduct.id)
          };
        }
        return cat;
      });

      updatedMenu = updatedMenu.map(cat => {
        if (cat.id === editCatId) {
          return {
            ...cat,
            items: [...cat.items, updatedProduct]
          };
        }
        return cat;
      });
    } else {
      updatedMenu = updatedMenu.map(cat => {
        if (cat.id === editingProductCatId) {
          return {
            ...cat,
            items: cat.items.map(i => i.id === editingProduct.id ? updatedProduct : i)
          };
        }
        return cat;
      });
    }

    updateMenuState(updatedMenu);
    setEditingProduct(null);
    showToast(`El plato "${updatedProduct.name}" se actualizó correctamente`, 'success');
  };

  const scrollToRef = (id: string) => {
    const element = sectionRefs.current[id];
    if (element) {
      setSelectedCategoryId(id);
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Computed state calculations
  const cartItemCount = cart.reduce((val, i) => val + i.qty, 0);
  const cartSubtotal = cart.reduce((val, i) => val + i.price * i.qty, 0);
  
  const getDiscountAmt = () => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === 'percent') {
      return Math.round(cartSubtotal * (Number(appliedCoupon.value) / 100));
    }
    if (appliedCoupon.type === 'fixed') {
      return Math.min(Number(appliedCoupon.value), cartSubtotal);
    }
    if (appliedCoupon.type === 'free_shipping') {
      return 0; // Se calcula restando el domicilio en getDeliveryCostAmt
    }
    if (appliedCoupon.type === 'bogo') {
      let bogoDiscount = 0;
      const buyQty = Number(appliedCoupon.bogoBuyQty) || 2;
      const freeQty = Number(appliedCoupon.bogoFreeQty) || 1;
      
      cart.forEach(item => {
        if (!appliedCoupon.specificProductId || item.productId === appliedCoupon.specificProductId) {
          const matchedPackages = Math.floor(item.qty / buyQty);
          if (matchedPackages > 0) {
            bogoDiscount += matchedPackages * freeQty * item.price;
          }
        }
      });
      return bogoDiscount;
    }
    if (appliedCoupon.type === 'specific_product') {
      let specDiscount = 0;
      cart.forEach(item => {
        if (item.productId === appliedCoupon.specificProductId) {
          const discountType = appliedCoupon.specificProductDiscountType || 'percent';
          if (discountType === 'percent') {
            specDiscount += Math.round((item.price * item.qty) * (Number(appliedCoupon.value) / 100));
          } else {
            specDiscount += Math.min(Number(appliedCoupon.value) * item.qty, item.price * item.qty);
          }
        }
      });
      return specDiscount;
    }
    return 0;
  };

  const getDeliveryCostAmt = () => {
    if (custInfo.ot !== 'domicilio') return 0;
    if (appliedCoupon?.type === 'free_shipping') return 0;
    return deliveryCost;
  };

  const currentDiscount = getDiscountAmt();
  const currentDeliveryCost = getDeliveryCostAmt();
  const cartTotalWithRecargo = Math.max(0, cartSubtotal + currentDeliveryCost - currentDiscount);

  return (
    <div className="min-h-screen bg-[#070707] text-gray-100 font-sans selection:bg-[#F5C518] selection:text-black leading-relaxed">
      
      {/* --- TOASTER --- */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none w-[90%] max-w-sm">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className={`px-5 py-3 rounded-full flex items-center justify-between gap-3 shadow-xl backdrop-blur-md ${
                toast.type === 'error' 
                  ? 'bg-rose-950/90 border border-rose-500 text-rose-200' 
                  : toast.type === 'info'
                    ? 'bg-[#1a1a1a]/95 border border-sky-400/30 text-sky-200'
                    : 'bg-[#151515]/95 border border-[#F5C518]/40 text-[#F5C518]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle className="w-5 h-5 flex-shrink-0 text-current" />
                <span className="text-xs font-semibold">{toast.message}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* --- FLOATING ORDER TRACKER WIDGET --- */}
      {activeOrder && (
        <div className="fixed bottom-6 right-6 z-30 font-sans">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-neutral-950/95 border border-amber-500/35 rounded-2xl p-4 shadow-2xl backdrop-blur-md max-w-xs space-y-3 relative overflow-hidden"
          >
            {/* Blinking green active dot */}
            <div className="absolute top-3.5 right-3.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-[#F5C518]">
                {activeOrder.step === 0 && <Bell className="w-4 h-4 animate-bounce" />}
                {activeOrder.step === 1 && <ChefHat className="w-4 h-4 animate-spin" style={{ animationDuration: '3s' }} />}
                {activeOrder.step === 2 && <Bike className="w-4 h-4" />}
                {activeOrder.step === 3 && <Award className="w-4 h-4 text-emerald-400" />}
              </div>
              <div className="max-w-44 pr-4">
                <p className="text-[9px] text-gray-500 font-mono font-bold leading-none">PEDIDO EN CURSO</p>
                <p className="text-xs text-white font-extrabold font-mono mt-0.5 truncate">{activeOrder.id} ({activeOrder.time})</p>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono">
                <span>Estado actual:</span>
                <span className="font-extrabold text-amber-400 uppercase">
                  {activeOrder.step === 0 && 'Recibido'}
                  {activeOrder.step === 1 && 'En Cocina'}
                  {activeOrder.step === 2 && (activeOrder.type === 'mesa' ? 'Servido' : activeOrder.type === 'llevar' ? 'Listo' : 'En camino')}
                  {activeOrder.step === 3 && 'Entregado'}
                </span>
              </div>
              
              {/* Mini progress line indicator */}
              <div className="w-full h-1 bg-neutral-900 rounded-full overflow-hidden flex gap-0.5">
                <div className={`h-full rounded-l-full transition-colors ${activeOrder.step >= 0 ? 'bg-[#F5C518] flex-1' : 'bg-transparent flex-1'}`} />
                <div className={`h-full transition-colors ${activeOrder.step >= 1 ? 'bg-[#F5C518] flex-1' : 'bg-transparent flex-1'}`} />
                <div className={`h-full transition-colors ${activeOrder.step >= 2 ? 'bg-[#F5C518] flex-1' : 'bg-transparent flex-1'}`} />
                <div className={`h-full rounded-r-full transition-colors ${activeOrder.step >= 3 ? 'bg-[#F5C418] flex-1' : 'bg-transparent flex-1'}`} />
              </div>
            </div>

            <div className="flex gap-1.5 pt-1">
              <button 
                onClick={() => setTrackerOpen(true)}
                className="flex-1 bg-[#F5C518] hover:bg-amber-400 text-black py-1.5 px-2.5 rounded-xl text-[10px] font-black uppercase text-center cursor-pointer transition-colors"
              >
                Ver Tracker 🏍️
              </button>
              <button 
                onClick={() => {
                  if (confirm('¿Deseas descartar el seguimiento de este pedido? Esto no cancelará la preparación en cocina.')) {
                    setActiveOrder(null);
                    localStorage.removeItem('lp_active_order');
                  }
                }}
                className="bg-neutral-900 hover:bg-rose-500/10 hover:text-rose-400 text-gray-500 py-1.5 px-2 rounded-xl text-[10px] font-mono cursor-pointer transition-colors"
                title="Cerrar Seguimiento local"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* --- DETAILED LIVE ORDER TRACKING MODAL --- */}
      <AnimatePresence>
        {trackerOpen && activeOrder && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0a0a0b] border border-neutral-900 p-6 sm:p-7 rounded-3xl w-full max-w-sm text-left shadow-2xl relative space-y-6"
            >
              <button 
                onClick={() => setTrackerOpen(false)}
                className="absolute top-4 right-4 bg-neutral-900 hover:bg-neutral-800 p-1..5 text-gray-500 hover:text-white rounded-full transition-all cursor-pointer z-10"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="border-b border-neutral-900 pb-3">
                <span className="text-[9px] uppercase font-bold text-amber-400 bg-[#F5C518]/10 px-2.5 py-0.5 rounded border border-amber-500/20 font-mono tracking-widest">
                  SEGUIMIENTO EN VIVO · LA PREFERIDA
                </span>
                <h3 className="font-bebas text-3xl tracking-widest text-[#F5C518] mt-1.5 flex items-center gap-1.5">
                  ORDEN {activeOrder.id}
                </h3>
                <p className="text-[10px] text-gray-500 font-mono mt-0.5">Enviado a WhatsApp a las {activeOrder.time}</p>
              </div>

              {/* Steps timeline visual design */}
              <div className="relative pl-7 space-y-5">
                
                {/* Visual timeline vertical line bar */}
                <div className="absolute left-3 top-2.5 bottom-2.5 w-0.5 bg-neutral-900" />

                {/* STEP 1: Pedido Recibido */}
                <div className="relative">
                  <span className={`absolute -left-7 top-1 w-2.5 h-2.5 rounded-full border-2 transition-all duration-300 ${
                    activeOrder.step >= 0 
                      ? 'bg-[#F5C518] border-[#070707] shadow-[0_0_8px_rgba(245,197,24,0.6)]' 
                      : 'bg-[#111] border-neutral-800'
                  }`} />
                  <div>
                    <h4 className={`text-xs font-bold font-mono tracking-wider uppercase ${activeOrder.step >= 0 ? 'text-[#F5C518]' : 'text-neutral-500'}`}>
                      📥 1. Pedido Recibido
                    </h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {activeOrder.step === 0 
                        ? 'La Preferida recibió tu orden. Esperando asignación de comandero...' 
                        : 'Recibido correctamente y despachado al equipo de cocina.'}
                    </p>
                  </div>
                </div>

                {/* STEP 2: En Parrilla / Cocina */}
                <div className="relative">
                  <span className={`absolute -left-7 top-1 w-2.5 h-2.5 rounded-full border-2 transition-all duration-300 ${
                    activeOrder.step >= 1 
                      ? 'bg-[#F5C518] border-[#070707] shadow-[0_0_8px_rgba(245,197,24,0.6)]' 
                      : 'bg-[#111] border-neutral-800'
                  }`} />
                  <div>
                    <h4 className={`text-xs font-bold font-mono tracking-wider uppercase ${activeOrder.step >= 1 ? 'text-[#F5C518]' : 'text-neutral-500'}`}>
                      🔥 2. En Parrilla y Asado
                    </h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {activeOrder.step < 1 
                        ? 'En espera de cocina...' 
                        : activeOrder.step === 1
                          ? '👨‍🍳 ¡En parrilla! El asador está cocinando tu plato con amor.'
                          : 'Asado en su punto y empacado herméticamente.'}
                    </p>
                  </div>
                </div>

                {/* STEP 3: Domiciliario en Camino / Listo */}
                <div className="relative">
                  <span className={`absolute -left-7 top-1 w-2.5 h-2.5 rounded-full border-2 transition-all duration-300 ${
                    activeOrder.step >= 2 
                      ? 'bg-[#F5C518] border-[#070707] shadow-[0_0_8px_rgba(245,197,24,0.6)]' 
                      : 'bg-[#111] border-neutral-800'
                  }`} />
                  <div>
                    <h4 className={`text-xs font-bold font-mono tracking-wider uppercase ${activeOrder.step >= 2 ? 'text-[#F5C518]' : 'text-neutral-500'}`}>
                      {activeOrder.type === 'mesa' ? '🍽️ 3. Servido a Mesa' : activeOrder.type === 'llevar' ? '🛍️ 3. Listo para retirar' : '🏍️ 3. Envío en camino'}
                    </h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {activeOrder.step < 2 
                        ? 'Esperando preparación del pedido...' 
                        : activeOrder.step === 2
                          ? activeOrder.type === 'mesa'
                            ? '¡Listo! Los meseros van pitando a tu mesa con los platos calientes.'
                            : activeOrder.type === 'llevar'
                              ? '¡Listo! Pasa al mostrador con tu celular y reclama tu pedido caliente.'
                              : '🏍️ El domiciliario de La Preferida va volando a tu dirección.'
                          : 'Entrega en sitio completada.'}
                    </p>
                  </div>
                </div>

                {/* STEP 4: Pedido Entregado */}
                <div className="relative">
                  <span className={`absolute -left-7 top-1 w-2.5 h-2.5 rounded-full border-2 transition-all duration-300 ${
                    activeOrder.step >= 3 
                      ? 'bg-emerald-400 border-[#070707] shadow-[0_0_8px_rgba(16,185,129,0.65)]' 
                      : 'bg-[#111] border-neutral-800'
                  }`} />
                  <div>
                    <h4 className={`text-xs font-bold font-mono tracking-wider uppercase ${activeOrder.step >= 3 ? 'text-emerald-400 font-extrabold' : 'text-neutral-500'}`}>
                      🎉 4. Pedido Entregado
                    </h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {activeOrder.step < 3 
                        ? 'En espera de confirmación de entrega...' 
                        : 'Disfruta de la mejor gastronomía costera de Ciénaga. ¡Muchas gracias! 👋'}
                    </p>
                  </div>
                </div>

              </div>

              {/* Order breakdown summary */}
              <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-900 space-y-2.5 text-[11px] text-gray-300 font-mono">
                <p className="text-[9px] text-gray-500 tracking-wider font-extrabold uppercase">Resumen de Orden</p>
                <div className="flex justify-between">
                  <span>Cliente:</span>
                  <span className="text-white font-bold">{activeOrder.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Artículos:</span>
                  <span className="text-white font-bold">{activeOrder.itemsCount} productos</span>
                </div>
                <div className="flex justify-between flex-wrap gap-2">
                  <span>Método de Entrega:</span>
                  <span className="text-[#F5C518] font-black uppercase text-[10px]">
                    {activeOrder.type === 'mesa' ? 'MESA' : activeOrder.type === 'llevar' ? 'LLEVAR / RETIRO' : 'DOMICILIO'}
                  </span>
                </div>
                <div className="flex justify-between uppercase">
                  <span>Pago:</span>
                  <span className="text-white font-bold">{activeOrder.payMethod}</span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-neutral-900 text-white font-bold text-sm">
                  <span>Total Pagado:</span>
                  <span className="text-[#F5C518] font-mono font-bold">${activeOrder.total.toLocaleString('es-CO')}</span>
                </div>
              </div>

              {/* Simulation debug/tester buttons */}
              <div className="bg-amber-500/5 border border-[#F5C518]/10 p-3 rounded-2xl space-y-1.5">
                <p className="text-[9px] text-[#F5C518] font-bold tracking-widest font-mono text-center uppercase">Consola de Simulación (Piloto Demo)</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    disabled={activeOrder.step >= 3}
                    onClick={() => {
                      setActiveOrder(prev => {
                        if (!prev || prev.step >= 3) return prev;
                        const nextStep = prev.step + 1;
                        const updated = { ...prev, step: nextStep };
                        localStorage.setItem('lp_active_order', JSON.stringify(updated));
                        
                        showToast(`Simulador: Avance forzado al paso ${nextStep + 1}/4 ⚡`, 'success');
                        return updated;
                      });
                    }}
                    className={`py-1.5 px-2.5 rounded-xl text-[10px] font-bold font-mono transition-colors text-center cursor-pointer ${
                      activeOrder.step >= 3 
                        ? 'bg-neutral-900 text-gray-600 cursor-not-allowed' 
                        : 'bg-neutral-900 hover:bg-neutral-800 text-white'
                    }`}
                  >
                    Avanzar Estado ⚡
                  </button>
                  <button
                    onClick={() => {
                      const updated = { ...activeOrder, step: 0 };
                      setActiveOrder(updated);
                      localStorage.setItem('lp_active_order', JSON.stringify(updated));
                      showToast('Simulador: Seguimiento reiniciado al Estado 1 🔄', 'info');
                    }}
                    className="bg-neutral-900 hover:bg-neutral-800 text-white py-1.5 px-2.5 rounded-xl text-[10px] font-bold font-mono transition-colors text-center cursor-pointer"
                  >
                    Reiniciar Tracker 🔄
                  </button>
                </div>
              </div>

              <button 
                onClick={() => setTrackerOpen(false)}
                className="w-full bg-[#F5C518] hover:bg-amber-400 text-black py-3 rounded-2xl text-xs font-black uppercase text-center cursor-pointer font-sans transition-colors"
              >
                Cerrar Tracker
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- FLOATING HEADER --- */}
      <header className="sticky top-0 bg-[#0d0d0dc0] backdrop-blur-md border-b-2 border-[#F5C518] z-30 transition-all">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-18 flex items-center justify-between gap-2">
          
          {/* Logo & Slogan */}
          <div 
            id="logoArea"
            className="flex items-center gap-3 cursor-pointer group select-none relative"
            onClick={() => {
              // Secret Admin Entry Logic: 4 fast taps triggers password entry
              const taps = parseInt(sessionStorage.getItem('taps') || '0') + 1;
              sessionStorage.setItem('taps', String(taps));
              if (taps >= 4) {
                setPwOpen(true);
                sessionStorage.setItem('taps', '0');
              }
              setTimeout(() => {
                sessionStorage.setItem('taps', '0');
              }, 2000);
            }}
            title="Toca 4 veces el logo para acceder al panel"
          >
            {!logoErr ? (
              <img 
                src="/logo.png" 
                onError={() => setLogoErr(true)} 
                className="w-12 h-12 object-contain rounded-full border-2 border-[#F5C518] bg-[#111] group-hover:scale-105 transition-transform duration-300 shadow-lg" 
                alt="Logo La Preferida" 
              />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-tr from-[#F5C518] to-amber-300 rounded-full flex items-center justify-center text-black font-extrabold text-xl shadow-lg border-2 border-[#0d0d0d] group-hover:scale-105 transition-transform duration-300">
                LP
              </div>
            )}
            <div>
              <h1 className="font-bebas text-2xl tracking-wide text-[#F5C518] group-hover:text-amber-400 transition-colors leading-none">LA PREFERIDA</h1>
              <span className="text-[9px] text-gray-500 leading-none uppercase tracking-widest block mt-1">Restaurante · Ciénaga</span>
            </div>
          </div>

          {/* System status beacon */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${restaurantOpen ? 'bg-green-500 animate-pulse' : 'bg-rose-500'}`} />
                <span className="text-xs font-bold text-gray-200">
                  {restaurantOpen ? 'Abiertos en Cocina' : 'Cerrado Temporal'}
                </span>
              </div>
              <span className="text-[10px] text-gray-400 mt-0.5 font-mono">{scheduleTodayMsg}</span>
            </div>

            {/* Shopping Cart button */}
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={() => setCartOpen(true)}
              className="bg-[#F5C518] text-[#0d0d0d] px-5 py-2.5 rounded-full font-bold text-sm tracking-tight flex items-center gap-2 hover:bg-amber-400 transition-all shadow-[0_4px_16px_rgba(245,197,24,0.3)] hover:shadow-[0_6px_22px_rgba(245,197,24,0.45)] cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-black" />
              <span>Mi Pedido</span>
              <span className="bg-black text-[#F5C518] rounded-full w-5.5 h-5.5 flex items-center justify-center text-[10px] font-black font-mono">
                {cartItemCount}
              </span>
            </motion.button>
          </div>
        </div>
      </header>

      {/* --- FLOATING NEWS BANNER --- */}
      <AnimatePresence>
        {promoOn && promoText && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-[#F5C518] text-black text-center text-xs font-bold py-2 px-4 flex items-center justify-center gap-2 overflow-hidden shadow-md"
          >
            <Sparkles className="w-4 h-4 text-black animate-bounce flex-shrink-0" />
            <span>{promoText}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- BUSINESS HOURS CAROUSEL OVERVIEW BAR --- */}
      <div className="bg-[#111] border-b border-neutral-900/60 py-1.5 px-4 overflow-x-auto scrollbar-none scroll-smooth">
        <div className="max-w-6xl mx-auto flex gap-3.5 items-center whitespace-nowrap text-[10.5px] text-gray-400 font-mono">
          <span className="font-sans font-bold text-[#F5C518] uppercase tracking-wider text-[9.5px]">Horario Semanal:</span>
          <div className="flex gap-3.5">
            {weeklySchedule.map((sched, sIdx) => {
              const formatT = (t: string) => {
                if (!t) return '5:00 PM';
                const [h, m] = t.split(':').map(Number);
                const ampm = h >= 12 ? 'PM' : 'AM';
                return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${ampm}`;
              };
              return (
                <React.Fragment key={sched.dayIndex}>
                  {sIdx > 0 && <span className="opacity-40">•</span>}
                  <span className={sched.closed ? 'opacity-50 text-gray-400 line-through decoration-rose-900/20' : 'text-gray-200'}>
                    <span className="font-bold uppercase text-[9.5px] tracking-tight text-[#F5C518]/90">{sched.dayLabel.slice(0, 3)}:</span>{' '}
                    {sched.closed ? 'Cerrado' : `${formatT(sched.openTime)} - ${formatT(sched.closeTime)}`}
                  </span>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* --- HERO BRAND INTRO BENTO GRID --- */}
      <section className="bg-gradient-to-b from-[#111] to-[#070707] py-6 border-b border-neutral-900/80 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* Main Info */}
          <div className="md:col-span-2 bg-[#0e0e0e] border border-neutral-800/60 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#F5C518]/5 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="inline-flex items-center gap-1.5 bg-[#F5C518]/10 text-[#F5C518] px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider mb-4">
                <Utensils className="w-3.5 h-3.5" />
                <span>Gastronomía Cienaguera de Tradición</span>
              </div>
              <h2 className="font-bebas text-4xl sm:text-5xl md:text-6xl text-white tracking-wide leading-none">
                LOS MEJORES ASADOS, <br />
                <span className="text-[#F5C518]">DESGRANADOS Y SALCHIPAPAS</span>
              </h2>
              <p className="text-gray-400 text-sm mt-3 max-w-xl">
                Llevamos el inigualable sabor costeño a tu mesa en Ciénaga, Magdalena. Descubre ingredientes asados al carbón, el genuino sabor del queso costeño de campo y salsas que enamoran.
              </p>
            </div>
            
            <div className="mt-6 flex flex-wrap gap-4 text-xs text-gray-300">
              <span className="flex items-center gap-1.5 bg-neutral-900 px-3 py-1.5 rounded-full">
                🚚 Delivery Veloz en Ciénaga
              </span>
              <span className="flex items-center gap-1.5 bg-neutral-900 px-3 py-1.5 rounded-full">
                🧀 Doble Queso Sopleteado
              </span>
              <span className="flex items-center gap-1.5 bg-neutral-900 px-3 py-1.5 rounded-full">
                💬 Pide directo al WhatsApp
              </span>
            </div>
          </div>

          {/* Interactive Status & Quick Action Card */}
          <div className="bg-[#0e0e0e] border border-neutral-800/60 rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
            
            <div>
              <h3 className="text-gray-200 font-bold text-sm tracking-tight mb-2">Estado del Restaurante</h3>
              <div className="bg-neutral-950/80 rounded-2xl p-4 border border-neutral-900">
                <div className="flex items-center gap-3">
                  <div className={`w-3.5 h-3.5 rounded-full ${restaurantOpen ? 'bg-green-500 animate-pulse' : 'bg-rose-500'}`} />
                  <div>
                    <p className="text-sm font-extrabold text-white">
                      {restaurantOpen ? '¡Estamos calientes!' : 'Cerramos por el momento'}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {restaurantOpen ? 'Tu pedido ingresará de inmediato a cocina' : nextOpeningMsg}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-neutral-900 flex justify-between items-center">
              <div>
                <p className="text-[11px] text-gray-500">¿Re-ordenar pedido?</p>
                <p className="text-xs font-bold text-[#F5C518]">Cargar el Último</p>
              </div>
              <button 
                onClick={handleLoadPreviousOrder}
                className="w-10 h-10 rounded-full bg-neutral-900 hover:bg-[#F5C518] hover:text-black transition-all flex items-center justify-center text-gray-400 group cursor-pointer"
                title="Restaurar último pedido realizado en esta máquina"
              >
                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* --- SEARCH HEADER SYSTEM --- */}
      <section className="bg-[#070707] sticky top-18 z-20 py-4 px-4 border-b border-neutral-900 overflow-visible">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Quick Search */}
          <div className="relative flex-1 max-w-xl">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-bold">
              BUSCAR:
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Escribe hamburguesa, salchipapa, pollo, lomo..."
              className="w-full bg-[#111] text-white pl-20 pr-12 py-3.5 rounded-2xl text-xs sm:text-sm font-semibold border border-neutral-800 focus:outline-none focus:border-[#F5C518] focus:ring-4 focus:ring-[#F5C518]/10 transition-all placeholder:text-gray-600 block shadow-inner"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-neutral-800 text-gray-400 flex items-center justify-center hover:bg-neutral-700 hover:text-white transition-all text-xs cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Scollable Segment Category links */}
          <div className="overflow-x-auto scrollbar-none flex items-center gap-2 p-1 max-w-full">
            {searchQuery.trim() === '' && menu.map(category => (
              <button
                key={category.id}
                onClick={() => scrollToRef(category.id)}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategoryId === category.id 
                    ? 'bg-[#F5C518] text-black shadow-lg shadow-[#F5C518]/20' 
                    : 'bg-[#111] hover:bg-neutral-800 text-gray-400 hover:text-white border border-neutral-900'
                }`}
              >
                {category.name}
              </button>
            ))}
            {searchQuery.trim() !== '' && (
              <span className="text-xs font-mono text-gray-500 px-2 py-1.5 bg-neutral-950 rounded-lg">
                Viendo {searchCount} coincidencia{searchCount !== 1 ? 's' : ''} para "{searchQuery}"
              </span>
            )}
          </div>

        </div>
      </section>

      {/* --- MAIN FOOD CATALOG AND GRID LAYOUT --- */}
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8 min-h-120">
        
        {/* If closed warning overlay for attention */}
        {!restaurantOpen && (
          <div className="bg-rose-950/20 border border-rose-500/30 rounded-3xl p-6 mb-10 flex flex-col md:flex-row gap-5 items-center justify-between">
            <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row">
              <div className="w-12 h-12 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-400 flex-shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-rose-200 font-bold text-sm">Actualmente estamos cerrados al público</h4>
                <p className="text-xs text-rose-300/70 mt-1 max-w-xl">
                  Estamos fuera del horario ordinario de cocina. Puedes ir armando tu pedido y guardarlo. El envío se consolidará tan pronto abramos de nuevo.
                </p>
              </div>
            </div>
            <div className="bg-rose-500/15 text-rose-200 font-extrabold text-xs px-4 py-2 rounded-full border border-rose-500/20">
              {nextOpeningMsg || 'Pausa de Servicio'}
            </div>
          </div>
        )}

        {/* Dynamic Search Results vs Normal menu segments */}
        {searchQuery.trim() !== '' ? (
          <div>
            <h3 className="font-bebas text-3xl text-[#F5C518] tracking-widest border-l-4 border-[#F5C518] pl-3 mb-6">
              RESULTADOS DE BÚSQUEDA ({searchCount})
            </h3>
            {searchCount === 0 ? (
              <div className="text-center py-20 text-neutral-600 bg-[#0c0c0c] border border-neutral-900 rounded-3xl">
                <Utensils className="w-12 h-12 mx-auto mb-4 stroke-[1.2] text-neutral-800" />
                <p className="text-gray-400 font-bold text-sm">No encontramos ningún producto que coincida</p>
                <p className="text-xs text-gray-600 mt-1">Sugerencia: Intenta buscar ingredientes alternativos como "queso", "pollo", "salchicha".</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {menu.map(cat => 
                  cat.items.map(p => {
                    const matchName = p.name.toLowerCase().includes(searchQuery.toLowerCase());
                    const matchDesc = p.desc.toLowerCase().includes(searchQuery.toLowerCase());
                    const matchIng = p.ing.some(i => i.toLowerCase().includes(searchQuery.toLowerCase()));
                    if (matchName || matchDesc || matchIng) {
                      return (
                        <div 
                          key={p.id}
                          onClick={() => handleOpenProductModal(p, cat.name)}
                          className="bg-[#0e0e0e] border border-neutral-900 rounded-2xl p-5 hover:border-[#F5C518]/50 transition-all duration-300 relative overflow-hidden flex flex-col justify-between group h-full shadow-md cursor-pointer"
                        >
                          <div>
                            <div className="flex justify-between items-start gap-2 mb-2">
                              <h4 className="font-bold text-sm text-gray-200 group-hover:text-[#F5C518] transition-colors">{p.name}</h4>
                              <span className="font-bebas text-xl text-[#F5C518]">${p.price.toLocaleString('es-CO')}</span>
                            </div>
                            <p className="text-[11px] text-gray-500 leading-relaxed mb-4 line-clamp-2">{p.desc}</p>
                          </div>

                          <div className="flex items-center justify-between mt-auto pt-3 border-t border-neutral-900/60 text-[10.5px]">
                            <span className="text-[#F5C518] underline group-hover:font-bold transition-all">Ver ingredientes</span>
                            <div className="flex gap-2">
                              <button 
                                onClick={(e) => handleAddItemToCartDirect(p, e)}
                                className="bg-[#F5C518] hover:bg-white text-black font-black w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer transition-all"
                                title="Añadir Rápido"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-12">
            {menu.map(category => (
              <div 
                key={category.id} 
                ref={el => { sectionRefs.current[category.id] = el; }}
                className="scroll-mt-36"
              >
                <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-neutral-900 pb-3 mb-6 gap-2">
                  <div>
                    <h3 className="font-bebas text-3xl sm:text-4xl text-[#F5C518] tracking-widest flex items-center gap-2">
                      <span className="w-1.5 h-7 bg-[#F5C518] inline-block" />
                      {category.name}
                    </h3>
                    {category.note && (
                      <p className="text-xs text-gray-500 italic mt-1 font-mono">{category.note}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-neutral-600 font-mono hidden md:inline">
                    {category.items.length} productos disponibles
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {category.items.map(p => (
                    <div 
                      key={p.id}
                      onClick={() => p.ok && handleOpenProductModal(p, category.name)}
                      className={`bg-[#0e0e0e] border rounded-3xl p-5 transition-all duration-300 relative overflow-hidden flex flex-col justify-between group h-full shadow-md ${
                        p.ok 
                          ? 'border-neutral-900 hover:border-[#F5C518]/50 cursor-pointer' 
                          : 'border-neutral-950 opacity-40 cursor-not-allowed'
                      }`}
                    >
                      {/* Popular indicator badge */}
                      {p.ok && (p.popular || p.recommended) && (
                        <div className="absolute top-0 right-0 bg-[#F5C518] text-black font-extrabold text-[8px] uppercase px-3 py-1 rounded-bl-xl tracking-wider z-10 shadow-sm flex items-center gap-0.5">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>{p.recommended ? 'Recomendado' : 'Favorito'}</span>
                        </div>
                      )}

                      <div>
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <h4 className="font-extrabold text-sm sm:text-base text-gray-200 group-hover:text-[#F5C518] transition-colors pr-2">
                            {p.name}
                          </h4>
                          <span className="font-bebas text-xl sm:text-2xl text-[#F5C518] flex-shrink-0">
                            ${p.price.toLocaleString('es-CO')}
                          </span>
                        </div>
                        <p className="text-[11px] sm:text-xs text-gray-500 leading-relaxed mb-4 clamp-2-lines">
                          {p.desc}
                        </p>
                      </div>

                      {/* Card Footer tags and quick action */}
                      <div className="flex items-center justify-between mt-auto pt-3 border-t border-neutral-900/60 text-[10.5px]">
                        {p.ok ? (
                          <>
                            <span className="text-gray-400 group-hover:text-amber-400 underline transition-all font-semibold">
                              Ingredientes y Extras
                            </span>
                            <button 
                              onClick={(e) => handleAddItemToCartDirect(p, e)}
                              className="bg-[#F5C518] hover:bg-white text-black font-black w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer transition-all shadow-sm"
                              title="Añadir Rápido"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <div className="flex items-center justify-between w-full text-rose-400">
                            <span className="flex items-center gap-1 font-bold">
                              <BadgeAlert className="w-3.5 h-3.5" />
                              Agotado temporalmente
                            </span>
                            <span className="text-[10px] text-gray-600">Preguntar luego</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

      </main>

      {/* --- INTERACTIVE PRODUCT DETAILS & CUSTOMIZER MODAL --- */}
      <AnimatePresence>
        {modalProduct && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Modal backdrop closer hit box */}
            <div className="absolute inset-0" onClick={() => setModalProduct(null)} />
            
            <motion.div 
              initial={{ y: 150, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 200, opacity: 0 }}
              className="bg-[#111] w-full max-w-lg rounded-t-3xl sm:rounded-3xl border-t sm:border border-neutral-800 p-6 z-10 max-h-[92vh] overflow-y-auto relative"
            >
              {/* Close Button top-right */}
              <button 
                onClick={() => setModalProduct(null)}
                className="absolute top-4 right-4 p-2 bg-neutral-900 rounded-full hover:bg-rose-500/10 hover:text-rose-400 text-gray-500 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="mb-4">
                <span className="text-[10px] font-bold text-[#F5C518] uppercase tracking-widest">{modalCategory}</span>
                <h3 className="font-bebas text-3xl text-[#F5C518] mt-1 tracking-wide">{modalProduct.name}</h3>
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">{modalProduct.desc}</p>
              </div>

              {/* Recipe highlights */}
              {modalProduct.ing && modalProduct.ing.length > 0 && (
                <div className="mb-5 bg-neutral-950 p-4 rounded-2xl border border-neutral-900">
                  <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-[#F5C518]" />
                    ¿Qué ingredientes trae?
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {modalProduct.ing.map(i => (
                      <span key={i} className="text-[11px] px-2.5 py-1 bg-neutral-900 text-gray-300 rounded-md">
                        {i}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* UPGRADES / EXTRAS OPTION BLOCK */}
              <div className="mb-5">
                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2.5">
                  Agregar Adicionales (Opcional)
                </h4>
                <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                  {ADICIONES_LIST.map(add => {
                    const isSelected = selectedAdditions.some(a => a.name === add.name);
                    return (
                      <button
                        key={add.name}
                        onClick={() => toggleAdditionSelection(add)}
                        className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between gap-1.5 cursor-pointer ${
                          isSelected 
                            ? 'bg-[#F5C518]/10 border-[#F5C518] text-[#F5C518]' 
                            : 'bg-neutral-950 border-neutral-900 text-gray-400 hover:text-white'
                        }`}
                      >
                        <div className="truncate">
                          <p className="font-semibold truncate">{add.name.replace('Adición de ', '')}</p>
                          <p className="text-[10px] opacity-80">+${add.price.toLocaleString('es-CO')}</p>
                        </div>
                        {isSelected && <Check className="w-4 h-4 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom specification Area */}
              <div className="mb-5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">
                  Indicación Especial
                </label>
                <textarea
                  value={modalNote}
                  onChange={(e) => setModalNote(e.target.value)}
                  placeholder="Ej. Sin cebolla, salsas aparte, término de carne 3/4..."
                  className="w-full bg-neutral-950 border border-neutral-900 rounded-xl p-3 text-xs focus:outline-none focus:border-[#F5C518] text-white placeholder:text-neutral-700 resize-none h-14"
                />
              </div>

              {/* Price Calculation details & purchase button */}
              <div className="pt-4 border-t border-neutral-900 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setModalQty(Math.max(1, modalQty - 1))}
                    className="w-9 h-9 bg-neutral-900 rounded-lg flex items-center justify-center text-gray-400 hover:text-white cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-bebas text-2xl w-4 text-center">{modalQty}</span>
                  <button 
                    onClick={() => setModalQty(modalQty + 1)}
                    className="w-9 h-9 bg-neutral-900 rounded-lg flex items-center justify-center text-gray-400 hover:text-white cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={handleAddModalToCart}
                  className="flex-1 bg-[#F5C518] hover:bg-amber-400 text-black font-extrabold py-3 rounded-xl text-xs sm:text-sm text-center cursor-pointer transition-colors shadow-md"
                >
                  Agregar por ${(
                    (modalProduct.price + selectedAdditions.reduce((sum, item) => sum + item.price, 0)) * modalQty
                  ).toLocaleString('es-CO')}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- CART SIDEBAR - STATE DRAWER --- */}
      <AnimatePresence>
        {cartOpen && (
          <div className="fixed inset-0 z-40 flex justify-end">
            {/* Backdrop black overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              onClick={() => setCartOpen(false)}
              className="absolute inset-0 bg-black"
            />

            {/* Sidebar Shell */}
            <motion.div 
              initial={{ translateX: '100%' }}
              animate={{ translateX: 0 }}
              exit={{ translateX: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-w-md bg-[#0a0a0b] h-full shadow-2xl flex flex-col justify-between border-l border-neutral-900"
            >
              
              {/* Header */}
              <div className="p-4 border-b border-neutral-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-[#F5C518]" />
                  <h3 className="font-bebas text-2xl tracking-wide text-[#F5C518]">Tu Pedido Actual</h3>
                </div>
                <button 
                  onClick={() => setCartOpen(false)}
                  className="p-2 text-gray-500 hover:text-rose-400 rounded-full cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                
                {/* 1. Customer form */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-neutral-900 pb-1">
                    Información del Cliente
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Nombre Completo *</label>
                      <input 
                        type="text" 
                        value={custInfo.name}
                        onChange={(e) => setCustInfo({ ...custInfo, name: e.target.value })}
                        placeholder="¿Cómo te llamas?" 
                        className="w-full bg-[#111] text-xs py-2.5 px-3.5 rounded-xl border border-neutral-800 text-white focus:outline-none focus:border-[#F5C518]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Número Celular / Teléfono</label>
                      <input 
                        type="tel" 
                        value={custInfo.phone}
                        onChange={(e) => setCustInfo({ ...custInfo, phone: e.target.value })}
                        placeholder="Ej. 300 123 4567" 
                        className="w-full bg-[#111] text-xs py-2.5 px-3.5 rounded-xl border border-neutral-800 text-white focus:outline-none focus:border-[#F5C518]"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Order Options switcher */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-neutral-900 pb-1">
                    Método de Entrega
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {(['mesa', 'llevar', 'domicilio'] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => setCustInfo({ ...custInfo, ot: type })}
                        className={`py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          custInfo.ot === type 
                            ? 'bg-[#F5C518] text-black shadow-md' 
                            : 'bg-[#111] text-gray-400 hover:text-white hover:bg-neutral-800'
                        }`}
                      >
                        {type === 'mesa' ? 'En Mesa' : type === 'llevar' ? 'Llevar' : 'Domicilio'}
                      </button>
                    ))}
                  </div>

                  {/* Context form depending on selection type */}
                  {custInfo.ot === 'mesa' && (
                    <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-900">
                      <div className="flex justify-between items-center mb-3">
                        <label className="text-[10px] uppercase font-bold text-gray-400 block">Selecciona tu Mesa del Mapa</label>
                        <span className="text-[10px] text-amber-400 font-bold px-2 py-0.5 bg-[#F5C518]/10 rounded">
                          {custInfo.mesa}
                        </span>
                      </div>

                      {/* Interactive SVG Restaurant Table selector Map */}
                      <div className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-900 p-2">
                        <svg viewBox="0 0 100 90" className="w-full h-auto">
                          <rect width="100" height="90" rx="6" fill="#0c0c0c" />
                          <text x="50" y="8" textAnchor="middle" fill="#333" fontSize="5" fontWeight="bold">PUERTA DE ENTRADA / CAJA</text>
                          <line x1="10" y1="12" x2="90" y2="12" stroke="#222" strokeWidth="1" strokeDasharray="2,2" />
                          
                          {/* Render tables as interactive visual circles */}
                          {INITIAL_TABLES.map(table => {
                            const isSelected = custInfo.mesa === table.name;
                            return (
                              <g 
                                key={table.id}
                                className="cursor-pointer group"
                                onClick={() => setCustInfo({ ...custInfo, mesa: table.name })}
                              >
                                <circle 
                                  cx={table.x} 
                                  cy={table.y + 10} 
                                  r={isSelected ? 10 : 8} 
                                  fill={isSelected ? '#F5C518' : '#222'} 
                                  stroke={isSelected ? '#fff' : '#444'}
                                  strokeWidth={isSelected ? '1' : '0.5'}
                                  className="transition-all duration-200 hover:fill-amber-400"
                                />
                                <text 
                                  x={table.x} 
                                  y={table.y + 11} 
                                  textAnchor="middle" 
                                  fill={isSelected ? '#000' : '#888'} 
                                  fontSize="4"
                                  fontWeight="bold"
                                  className="pointer-events-none"
                                >
                                  M{table.id}
                                </text>
                                <text 
                                  x={table.x} 
                                  y={table.y + 16} 
                                  textAnchor="middle" 
                                  fill="#555" 
                                  fontSize="3"
                                  className="pointer-events-none group-hover:fill-[#F5C518] transition-colors"
                                >
                                  {table.capacity}p
                                </text>
                              </g>
                            );
                          })}
                        </svg>
                        <p className="text-[9px] text-gray-500 text-center mt-2 font-mono">Haz clic sobre un círculo para indicarnos tu mesa física o usa el escáner piloto.</p>
                        
                        {/* Virtual QR Scan Trigger */}
                        <div className="mt-2.5 pt-2.5 border-t border-neutral-800/80 text-center">
                          <button
                            type="button"
                            onClick={handleSimulateQRScan}
                            className="bg-neutral-950/60 border border-neutral-800 hover:border-amber-400/40 text-gray-300 hover:text-white text-[11px] px-3 py-2 rounded-xl flex items-center justify-center gap-1.5 w-full transition-all cursor-pointer group font-mono"
                          >
                            <QrCode className="w-4 h-4 text-[#F5C518] group-hover:rotate-12 transition-transform" />
                            <span>Simular Escaneo QR en Mesa</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {custInfo.ot === 'domicilio' && (
                    <div className="space-y-4 bg-neutral-950 p-4 rounded-2xl border border-neutral-900">
                      
                      {/* Address Input & GPS Detector Row */}
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Dirección de Entrega en Ciénaga *</label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={custInfo.addr}
                            onChange={(e) => handleAddressChangeWithGpsReset(e.target.value)}
                            placeholder="Ej. Calle 10 #12-45, Barrio Centro" 
                            className="flex-1 bg-[#111] text-xs py-2.5 px-3.5 rounded-xl border border-neutral-800 text-white focus:outline-none focus:border-[#F5C518]"
                          />
                          <button
                            type="button"
                            disabled={gpsLoading}
                            onClick={handleGeolocateCustomer}
                            className={`px-3 py-2 text-xs font-bold rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
                              gpsLoading 
                                ? 'bg-neutral-900 border-neutral-850 text-neutral-500 cursor-not-allowed' 
                                : isGpsUsed
                                ? 'bg-green-950/20 border-green-800/60 text-green-400 hover:bg-green-900/30'
                                : 'bg-[#111] border-neutral-800 hover:border-neutral-700 hover:text-[#F5C518] text-white'
                            }`}
                            title="Haz clic para calcular tu distancia exacta al restaurante por GPS"
                          >
                            <MapPin className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">{gpsLoading ? 'GPS...' : isGpsUsed ? 'GPS ✓' : 'Usar GPS'}</span>
                          </button>
                        </div>
                      </div>

                      {gpsError && (
                        <p className="text-[9.5px] font-medium text-red-400 italic font-mono bg-red-950/10 p-2 rounded-lg border border-red-900/40">
                          ⚠️ {gpsError}
                        </p>
                      )}

                      {/* Dynamic Zone Selector */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[9px] uppercase font-bold text-gray-500 block">Sector / Tarifa de Domicilio en Ciénaga</label>
                          {isGpsUsed && (
                            <span className="text-[8.5px] font-bold text-green-450 uppercase tracking-widest bg-green-950/45 px-2 py-0.5 rounded-full border border-green-800/30">
                              ✓ Por GPS
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {CIENAGA_ZONES.map(zone => {
                            const isSelected = selectedZoneId === zone.id;
                            const displayName = zone.name.includes('(') ? zone.name.split('/')[1]?.trim() : zone.name;
                            return (
                              <button
                                type="button"
                                key={zone.id}
                                onClick={() => {
                                  setSelectedZoneId(zone.id);
                                  setIsGpsUsed(false);
                                }}
                                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer group ${
                                  isSelected 
                                    ? 'bg-neutral-900 border-[#F5C518]/60 shadow-[0_0_12px_rgba(245,197,24,0.08)]' 
                                    : 'bg-[#111] border-neutral-900 hover:border-neutral-800'
                                }`}
                              >
                                <div className="flex items-center justify-between w-full gap-1">
                                  <span className={`text-[10px] font-extrabold truncate ${isSelected ? 'text-[#F5C518]' : 'text-neutral-300'}`}>
                                    {displayName || zone.name}
                                  </span>
                                  <span 
                                    className="w-2 h-2 rounded-full flex-shrink-0" 
                                    style={{ backgroundColor: zone.colorHex }}
                                  />
                                </div>
                                <div className="mt-1.5 flex items-baseline justify-between w-full gap-2">
                                  <span className="text-[8.5px] text-gray-550 truncate max-w-[120px]" title={zone.barrios}>
                                    {zone.barrios}
                                  </span>
                                  <span className={`text-[10.5px] font-mono font-bold flex-shrink-0 ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                                    ${zone.cost.toLocaleString('es-CO')}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      
                      {geocodingMsg && (
                        <div className="bg-[#111] p-3 rounded-lg border border-neutral-800/80 flex items-start gap-2.5">
                          <MapPin className="w-4.5 h-4.5 text-[#F5C518] flex-shrink-0 animate-bounce mt-0.5" />
                          <span className="text-[10.5px] font-mono leading-normal text-gray-300">{geocodingMsg}</span>
                        </div>
                      )}
                      
                      <div className="h-32 rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 relative">
                        {/* Map Simulator */}
                        <div className="absolute inset-0 bg-neutral-950 flex flex-col items-center justify-center text-center p-4">
                          <Map className="w-8 h-8 text-neutral-800 mb-1" />
                          <span className="text-[9.5px] font-mono text-gray-500 uppercase tracking-widest">CIÉNAGA MAPS ENGINE</span>
                          <span className="text-[9.5px] text-neutral-600 mt-1">Simulado desde Calle 7 #14-08</span>
                        </div>
                        {custInfo.addr.trim().length >= 5 && (
                          <div className="absolute inset-0 bg-[#0d0d0d] p-3.5 flex flex-col justify-between border-2 border-dashed border-neutral-800">
                            {/* Accent border aligned with zone color */}
                            <div 
                              className="absolute inset-[1px] border pointer-events-none rounded-[10px]" 
                              style={{ borderColor: `${CIENAGA_ZONES.find(z => z.id === selectedZoneId)?.colorHex}25` }}
                            />
                            
                            <div className="text-[10px] font-mono text-gray-400 z-10">
                              <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                                <span className="text-white font-extrabold uppercase text-[9px] tracking-wide">Ruta Activa de Despacho (Ciénaga)</span>
                              </div>
                              <p className="truncate mt-1.5 opacity-80">📍 Origen: La Preferida (Calle 7 #14-08)</p>
                              <p className="truncate mt-0.5 opacity-80">🏁 Destino: {custInfo.addr}</p>
                              <p className="truncate mt-1 text-[9px] opacity-65 flex items-center gap-1">
                                <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CIENAGA_ZONES.find(z => z.id === selectedZoneId)?.colorHex }} />
                                Sectores: {CIENAGA_ZONES.find(z => z.id === selectedZoneId)?.barrios}
                              </p>
                            </div>
                            <div className="flex items-center justify-between text-[10px] font-mono z-10 font-bold border-t border-neutral-900/60 pt-1.5">
                              <span 
                                className="px-1.5 py-0.5 rounded text-[8.5px] uppercase text-black font-extrabold"
                                style={{ backgroundColor: CIENAGA_ZONES.find(z => z.id === selectedZoneId)?.colorHex }}
                              >
                                {CIENAGA_ZONES.find(z => z.id === selectedZoneId)?.name.split('/')[0]?.trim() || 'Ciénaga'}
                              </span>
                              <span className="text-[#F5C518]">
                                {distanceKm ? `~${distanceKm} km` : 'Calculando...'}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Payment Option */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-neutral-900 pb-1">
                    Método de Pago
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {(['Efectivo', 'Nequi', 'Bancolombia', 'Datafono'] as const).map(pay => (
                      <button
                        key={pay}
                        onClick={() => setCustInfo({ ...custInfo, pay })}
                        className={`p-2 rounded-xl text-[10.5px] font-bold transition-all flex items-center justify-between gap-1.5 cursor-pointer ${
                          custInfo.pay === pay 
                            ? 'bg-[#F5C518]/10 border border-[#F5C518] text-[#F5C518]' 
                            : 'bg-[#111] border border-neutral-900 text-gray-400 hover:text-white hover:bg-neutral-800'
                        }`}
                      >
                        <span>{pay}</span>
                        {custInfo.pay === pay && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Cart List of Items */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-neutral-900 pb-1">
                    Discos en Carrito ({cart.length})
                  </h4>

                  {cart.length === 0 ? (
                    <div className="text-center py-8 text-neutral-600 bg-neutral-950 border border-neutral-900 rounded-3xl">
                      <ShoppingBag className="w-10 h-10 mx-auto mb-2 text-neutral-800" />
                      <p className="text-xs font-bold text-gray-500">¿Aún no has agregado platos?</p>
                      <p className="text-[10px] text-gray-600 mt-1">Explora nuestra carta y agrega delicias.</p>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {cart.map(item => (
                        <div key={item.id} className="bg-neutral-950 border border-neutral-900/60 p-3 rounded-2xl flex gap-3 relative">
                          <div className="flex-1 min-w-0">
                            <p className="font-extrabold text-xs text-white truncate">{item.name}</p>
                            <p className="text-[10px] font-bold text-[#F5C518] font-mono mt-0.5">
                              ${item.price.toLocaleString('es-CO')} c/u
                            </p>
                            
                            {item.adiciones.length > 0 && (
                              <p className="text-[10px] text-gray-400 mt-1 leading-normal italic">
                                _Extras:_ {item.adiciones.map(a => `${a.name.replace('Adición de ', '')}`).join(', ')}
                              </p>
                            )}

                            {item.note && (
                              <p className="text-[10px] text-amber-500 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10 inline-block mt-2 italic font-mono max-w-full truncate">
                                "{item.note}"
                              </p>
                            )}

                            {/* Qty Switcher */}
                            <div className="flex items-center gap-2.5 mt-3">
                              <button 
                                onClick={() => updateCartQty(item.id, item.qty - 1)}
                                className="w-7 h-7 bg-neutral-900 hover:bg-neutral-800 text-gray-400 rounded flex items-center justify-center cursor-pointer"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="font-bebas text-lg w-4 text-center">{item.qty}</span>
                              <button 
                                onClick={() => updateCartQty(item.id, item.qty + 1)}
                                className="w-7 h-7 bg-neutral-900 hover:bg-neutral-800 text-gray-400 rounded flex items-center justify-center cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>

                              <button 
                                onClick={() => updateCartQty(item.id, 0)}
                                className="p-2 ml-auto text-rose-500 hover:bg-rose-500/10 rounded cursor-pointer"
                                title="Eliminar del carrito"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                </div>

                {/* Coupon Promotion Box moved here below items list */}
                <div className="bg-neutral-900/40 p-3.5 rounded-2xl border border-neutral-900/80 space-y-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1 font-mono tracking-wider">
                      <Ticket className="w-3.5 h-3.5 text-[#F5C518]" />
                      Cupón de Descuento
                    </span>
                    {appliedCoupon && (
                      <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-mono">
                        ACTIVO
                      </span>
                    )}
                  </div>
                  
                  {!appliedCoupon ? (
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        placeholder="Ej. MI_CUPON"
                        className="flex-1 bg-black border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white uppercase font-mono tracking-wider focus:outline-none focus:border-[#F5C518] placeholder-neutral-600"
                        onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                      />
                      <button 
                        onClick={handleApplyCoupon}
                        className="bg-[#F5C518] hover:bg-amber-400 text-black px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono transition-colors cursor-pointer"
                      >
                        Aplicar
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-black/40 border border-emerald-500/20 rounded-xl p-2 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400">
                          <Zap className="w-3 h-3" />
                        </div>
                        <div>
                          <p className="font-bold text-emerald-200 font-mono text-[11px]">{appliedCoupon.code}</p>
                          <p className="text-[9px] text-gray-400">
                            {appliedCoupon.type === 'percent' && `${appliedCoupon.value}% Descuento`}
                            {appliedCoupon.type === 'fixed' && `$${appliedCoupon.value.toLocaleString('es-CO')} Descuento`}
                            {appliedCoupon.type === 'free_shipping' && `Envío gratis total`}
                            {appliedCoupon.type === 'bogo' && `Promo Unidades ${appliedCoupon.bogoBuyQty}x${appliedCoupon.bogoBuyQty! - appliedCoupon.bogoFreeQty!}`}
                            {appliedCoupon.type === 'specific_product' && `Precio Especial en Producto`}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={handleRemoveCoupon}
                        className="text-rose-400 hover:text-rose-300 font-extrabold text-[10px] uppercase px-2 py-1 rounded hover:bg-rose-500/5 cursor-pointer"
                      >
                        Quitar
                      </button>
                    </div>
                  )}
                </div>

              </div>

              {/* Fixed Footer */}
              <div className="p-4 bg-neutral-950 border-t border-neutral-900 space-y-3.5">
                
                {/* Cost breakdown */}
                <div className="space-y-1.5 text-xs text-gray-400 font-mono">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="text-white">${cartSubtotal.toLocaleString('es-CO')}</span>
                  </div>
                  {custInfo.ot === 'domicilio' && (
                    <div className="flex justify-between">
                      <span>Recargo Domicilio ({CIENAGA_ZONES.find(z => z.id === selectedZoneId)?.name.split('/')[0]?.replace('Zona', 'Z.')?.trim() || 'Ciénaga'}):</span>
                      <span className={appliedCoupon?.type === 'free_shipping' ? 'text-gray-500 line-through' : 'text-amber-400'}>
                        +${deliveryCost.toLocaleString('es-CO')}
                      </span>
                    </div>
                  )}
                  {appliedCoupon?.type === 'free_shipping' && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Descuento de Envío:</span>
                      <span>-${deliveryCost.toLocaleString('es-CO')}</span>
                    </div>
                  )}
                  {currentDiscount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Descuento ({appliedCoupon?.code}):</span>
                      <span>-${currentDiscount.toLocaleString('es-CO')}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-sm font-bold text-white pt-2 border-t border-neutral-900 animate-pulse-subtle">
                    <span className="font-sans">Total Estimado:</span>
                    <span className="text-[#F5C518] text-xl font-mono">${cartTotalWithRecargo.toLocaleString('es-CO')}</span>
                  </div>
                </div>

                <button
                  onClick={handleSendToWhatsApp}
                  disabled={cart.length === 0}
                  className={`w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider cursor-pointer shadow-lg transition-all ${
                    cart.length > 0 
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/10' 
                      : 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-900'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-black" />
                  <span>Enviar Pedido al WhatsApp</span>
                </button>
                
                <p className="text-[10px] text-gray-500 text-center font-mono leading-normal">
                  Se abrirá tu aplicación de WhatsApp con toda la lista del pedido estructurada automáticamente.
                </p>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- SECRET ADMIN PASSWORD GATE MODAL --- */}
      <AnimatePresence>
        {pwOpen && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-40 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-[#111] border border-neutral-800/80 p-6 rounded-3xl w-full max-w-sm text-center shadow-2xl relative"
            >
              <button 
                onClick={() => setPwOpen(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center text-[#F5C518] mx-auto mb-4 border border-[#F5C518]/20">
                <Lock className="w-5 h-5 animate-pulse" />
              </div>

              <h3 className="font-bebas text-2xl tracking-widest text-[#F5C518]">Panel de Acceso</h3>
              <p className="text-[11px] text-gray-500 mt-1">Introduce la clave de administración para configurar el menú.</p>

              <div className="mt-4">
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && checkAdminPassword()}
                  placeholder="••••"
                  className="w-full bg-neutral-950 text-center tracking-widest py-3 rounded-xl border border-neutral-900 text-xl font-mono focus:outline-none focus:border-[#F5C518] text-white placeholder:text-neutral-800"
                />
                 {adminPasswordError && (
                   <p className="text-[10.5px] text-rose-400 mt-2 font-semibold font-mono flex items-center justify-center gap-1">
                     <AlertTriangle className="w-3.5 h-3.5" /> Contraseña incorrecta
                   </p>
                 )}
              </div>

              <div className="mt-6 flex flex-col gap-2">
                <button
                  onClick={checkAdminPassword}
                  className="w-full bg-[#F5C518] hover:bg-amber-400 text-black py-3 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
                >
                  Verificar Acceso
                </button>

                <div className="relative my-2 flex items-center justify-center">
                  <span className="absolute inset-x-0 h-px bg-neutral-800" />
                  <span className="relative bg-[#111] px-2.5 text-[9.5px] uppercase font-mono text-neutral-600">o accede sin clave</span>
                </div>

                <button
                  onClick={handleGoogleLogin}
                  className="w-full bg-neutral-950 hover:bg-neutral-900 border border-neutral-900 hover:border-neutral-800 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-[#F5C518] animate-pulse" />
                  Inicia Sesión con Google
                </button>

                <button
                  onClick={() => setPwOpen(false)}
                  className="text-xs text-gray-500 hover:text-white underline mt-1.5 cursor-pointer"
                >
                  Cancelar
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- VIRTUAL TABLE QR CODE SCANNER SIMULATOR MODAL --- */}
      <AnimatePresence>
        {qrScannerOpen && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-[#0a0a0b] border border-neutral-800 rounded-3xl p-6 text-center shadow-2xl relative overflow-hidden"
            >
              {/* Scanline line indicator */}
              <div className="absolute top-2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[#F5C518] to-transparent animate-scanline z-10" />

              <button 
                onClick={() => setQrScannerOpen(false)}
                className="absolute top-4 right-4 bg-neutral-900 hover:bg-neutral-800 p-2 text-gray-500 hover:text-white rounded-full transition-all cursor-pointer z-20"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="mx-auto w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center border border-amber-500/10 text-[#F5C518] mb-4">
                <QrCode className="w-6 h-6 animate-pulse" />
              </div>

              <h3 className="font-bebas text-2xl tracking-widest text-white uppercase text-amber-400">Escáner Virtual</h3>
              <p className="text-[11px] text-gray-400 max-w-xs mx-auto mt-1 leading-relaxed">
                Aproximando la cámara del celular al código QR pegado en la mesa física de La Preferida...
              </p>

              {/* Glowing Simulator Box */}
              <div className="my-6 relative bg-black/50 border border-neutral-800 rounded-2xl h-56 flex items-center justify-center overflow-hidden">
                {/* Simulated Camera glare */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(40,40,40,0.1)_0%,rgba(0,0,0,0.92)_85%)]" />
                
                {/* Scanning brackets */}
                <div className="w-36 h-36 border border-neutral-900 rounded-2xl relative flex items-center justify-center bg-zinc-950/20 z-10">
                  <span className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#F5C518] rounded-tl-sm" />
                  <span className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#F5C518] rounded-tr-sm" />
                  <span className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#F5C518] rounded-bl-sm" />
                  <span className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#F5C518] rounded-br-sm" />

                  {qrScanning ? (
                    <div className="text-center space-y-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#F5C518] mx-auto" />
                      <p className="text-[9px] text-[#F5C518] font-mono tracking-widest animate-pulse">ESCANEAR SENSOR...</p>
                    </div>
                  ) : (
                    <motion.div 
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="text-center space-y-1.5 z-10"
                    >
                      <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
                      <p className="text-[10px] font-black text-emerald-400 font-mono uppercase tracking-wider">MESA DETECTADA</p>
                      <span className="text-xs text-white font-extrabold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full block">
                        {custInfo.mesa}
                      </span>
                    </motion.div>
                  )}
                </div>

                {/* Simulated grid line overlay styling */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%),linear-gradient(90deg,rgba(245,197,24,0.03),rgba(0,0,0,0),rgba(245,197,24,0.03))] bg-[size:100%_4px,3px_100%] pointer-events-none" />
              </div>

              <p className="text-[10px] text-gray-500 font-mono">
                {qrScanning ? 'Enlazando red local de hostelería...' : '✔ Mesa asignada éticamente'}
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- SECURE ADMIN INSTRUMENT CABINET MODAL --- */}
      <AnimatePresence>
        {adminOpen && (
          <div className="fixed inset-0 bg-black/95 z-40 overflow-y-auto px-4 py-8">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="max-w-4xl mx-auto bg-[#0a0a0b] border border-neutral-900 rounded-3xl p-6 md:p-8 space-y-8 shadow-2xl relative"
            >
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-neutral-900 pb-4">
                <div>
                  <h2 className="font-bebas text-3xl sm:text-4xl text-[#F5C518] tracking-widest flex items-center gap-2">
                    <Settings className="w-8 h-8 text-[#F5C518]" />
                    PANEL DE OPERACIÓN DIARIA
                  </h2>
                  <p className="text-xs text-gray-500 mt-1 font-mono">Modo de edición instantáneo · Sincronizado localmente</p>

                  {currentUser?.email === 'lapreferidarestaurante2025@gmail.com' ? (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2.5">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] uppercase font-bold text-emerald-400 font-mono tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Sincronización en la Nube Activa
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">{currentUser.email}</span>
                      <button
                        onClick={async () => {
                          await logoutAdmin();
                          showToast('Sincronización deshabilitada (Modo Local)', 'info');
                        }}
                        className="text-[10px] text-rose-400 hover:text-rose-300 underline font-mono text-left cursor-pointer bg-transparent border-none p-0"
                      >
                        Desconectar Nube
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-x-2.5 gap-y-1 mt-2.5">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] uppercase font-bold text-amber-400 font-mono tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        Modo Local (Modificaciones aisladas)
                      </span>
                      <button
                        onClick={handleGoogleLogin}
                        className="inline-flex items-center gap-1 bg-[#F5C518] hover:bg-amber-400 text-black px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer border-none"
                      >
                        <Sparkles className="w-3 h-3" />
                        Sincronizar con Google
                      </button>
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => {
                    setAdminOpen(false);
                    showToast('Cambios retenidos con éxito', 'info');
                  }}
                  className="bg-neutral-900 hover:bg-rose-500/10 hover:text-rose-400 p-2.5 text-gray-300 rounded-full cursor-pointer transition-all"
                  title="Cerrar Panel"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Bento sections layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Promo Control */}
                <div className="bg-[#111] p-5 rounded-2xl border border-neutral-800/80 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-[#F5C518] uppercase tracking-wider mb-2">Anuncio del Día / Comunicado</h3>
                    <p className="text-[11px] text-gray-500 mb-3">Establece el texto que corre en el banner superior para ventas dirigidas.</p>
                    <textarea
                      value={activePromoDraft}
                      onChange={(e) => setActivePromoDraft(e.target.value)}
                      placeholder="Escribe la promoción del día..."
                      className="w-full bg-neutral-950 border border-neutral-900 rounded-xl p-3 text-xs focus:outline-none focus:border-[#F5C518] text-white resize-none h-18"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleSavePromo}
                      className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-xl text-xs font-bold"
                    >
                      Guardar Texto
                    </button>
                    <button 
                      onClick={handleTogglePromoOn}
                      className={`px-4 py-2 rounded-xl text-xs font-bold ${promoOn ? 'bg-red-900/40 text-red-200 border border-red-500/20' : 'bg-[#F5C518] text-black'}`}
                    >
                      {promoOn ? 'Desactivar Banner' : 'Publicar Banner'}
                    </button>
                  </div>
                </div>

                {/* Password reset widget */}
                <div className="bg-[#111] p-5 rounded-2xl border border-neutral-800/80 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-[#F5C518] uppercase tracking-wider mb-2">Seguridad Administrativa</h3>
                    <p className="text-[11px] text-gray-500 mb-3">Actualiza la clave de acceso para prevenir que los clientes ingresen al panel.</p>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Nueva clave" 
                        id="updatePassInput"
                        className="w-full bg-neutral-950 border border-neutral-900 rounded-xl py-2.5 px-3.5 text-xs text-white font-mono focus:outline-none focus:border-[#F5C518]"
                      />
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      const input = document.getElementById('updatePassInput') as HTMLInputElement;
                      if (input) {
                        handleChangePassword(input.value);
                        input.value = '';
                      }
                    }}
                    className="bg-neutral-900 hover:bg-neutral-800 text-gray-300 font-bold px-4 py-2.5 rounded-xl text-xs mt-3 block text-center"
                  >
                    Actualizar Clave
                  </button>
                </div>

              </div>

              {/* Weekly Schedule Settings */}
              <div className="bg-[#111] p-5 rounded-2xl border border-neutral-800/80 space-y-4">
                <div className="flex items-center gap-2 border-b border-neutral-900 pb-3">
                  <Clock className="w-5 h-5 text-amber-400" />
                  <div>
                    <h3 className="text-xs font-bold text-[#F5C518] uppercase tracking-wider">
                      Gestión de Horarios de Atención Diarios
                    </h3>
                    <p className="text-[11px] text-gray-500 font-mono">
                      Configura el horario de apertura y cierre de la cocina para cada día de la semana. Los clientes verán los cambios en tiempo real.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {weeklySchedule.map((sched) => (
                    <div 
                      key={sched.dayIndex} 
                      className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                        sched.closed 
                          ? 'bg-neutral-950/40 border-neutral-900/65 text-gray-500' 
                          : 'bg-neutral-950 border-neutral-900/80 hover:border-neutral-850'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className={`text-[11px] font-black uppercase tracking-wider ${sched.closed ? 'text-gray-600' : 'text-gray-200'}`}>
                          {sched.dayLabel}
                        </span>
                        
                        <button 
                          type="button"
                          onClick={() => {
                            const updated = weeklySchedule.map(s => s.dayIndex === sched.dayIndex ? { ...s, closed: !s.closed } : s);
                            setWeeklySchedule(updated);
                          }}
                          className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider cursor-pointer transition-colors border ${
                            sched.closed 
                              ? 'bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 border-rose-900/30' 
                              : 'bg-emerald-950/20 hover:bg-emerald-950/40 text-emerald-400 border-emerald-900/30'
                          }`}
                        >
                          {sched.closed ? 'Mín. Cerrado' : 'Act. Abierto'}
                        </button>
                      </div>

                      {!sched.closed ? (
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div>
                            <span className="text-gray-500 uppercase font-bold text-[9px] block mb-1">Apertura</span>
                            <input 
                              type="time" 
                              value={sched.openTime}
                              onChange={(e) => {
                                const updated = weeklySchedule.map(s => s.dayIndex === sched.dayIndex ? { ...s, openTime: e.target.value } : s);
                                setWeeklySchedule(updated);
                              }}
                              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-1 text-[11px] text-white focus:outline-none focus:border-[#F5C518] font-mono text-center"
                            />
                          </div>
                          <div>
                            <span className="text-gray-500 uppercase font-bold text-[9px] block mb-1">Cierre</span>
                            <input 
                              type="time" 
                              value={sched.closeTime}
                              onChange={(e) => {
                                const updated = weeklySchedule.map(s => s.dayIndex === sched.dayIndex ? { ...s, closeTime: e.target.value } : s);
                                setWeeklySchedule(updated);
                              }}
                              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-1 text-[11px] text-white focus:outline-none focus:border-[#F5C518] font-mono text-center"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="py-2.5 text-center text-[10.5px] font-mono text-neutral-700 italic">
                          Día de descanso comercial
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-neutral-950 p-3 rounded-xl border border-neutral-900/60">
                  <span className="text-[10px] text-gray-500 font-mono">
                    ⚠️ Recuerda pulsar Guardar para actualizar permanentemente en la nube y localmente.
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      await updateSettingsState(promoText, promoOn, undefined, weeklySchedule);
                      showToast('🕒 Horarios de atención actualizados con éxito', 'success');
                    }}
                    className="w-full sm:w-auto bg-[#F5C518] hover:bg-amber-400 text-black px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Guardar Horarios
                  </button>
                </div>
              </div>

              {/* CATEGORY ADDER SECTION */}
              <div className="bg-[#111] p-5 rounded-2xl border border-neutral-800/80">
                <h3 className="text-xs font-bold text-[#F5C518] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FolderPlus className="w-4.5 h-4.5 text-blue-400" />
                  Crear Nueva Categoría de Menú
                </h3>
                <p className="text-[11px] text-gray-500 mb-4">Crea una nueva clasificación (ejm: "Postres", "Vinos") para agrupar tus platos.</p>

                <form onSubmit={handleAddNewCategory} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Nombre de la Categoría *</label>
                    <input 
                      type="text" 
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      placeholder="Ej. Postres Exquisitos" 
                      className="w-full bg-neutral-950 border border-[#222] rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-[#F5C518] text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Nota Aclaratoria (Opcional)</label>
                    <input 
                      type="text" 
                      value={newCatNote}
                      onChange={(e) => setNewCatNote(e.target.value)}
                      placeholder="Ej. Todos vienen acompañados de helado" 
                      className="w-full bg-neutral-950 border border-[#222] rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-[#F5C518] text-white"
                    />
                  </div>
                  <div className="md:col-span-2 pt-1">
                    <button 
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold py-3 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Añadir Categoría al Menú
                    </button>
                  </div>
                </form>
              </div>

              {/* PRODUCT ADDER SECTION */}
              <div className="bg-[#111] p-5 rounded-2xl border border-neutral-800/80">
                <h3 className="text-xs font-bold text-[#F5C518] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Plus className="w-4.5 h-4.5 text-green-400" />
                  Agregar Nuevo Producto Especial
                </h3>
                <p className="text-[11px] text-gray-500 mb-4">Añade directamente platos con precios especiales al menú de la tienda.</p>

                <form onSubmit={handleAddNewProductItem} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Nombre Comercial *</label>
                    <input 
                      type="text" 
                      value={newProdName}
                      onChange={(e) => setNewProdName(e.target.value)}
                      placeholder="Ej. Hamburguesa Triple Bacon" 
                      className="w-full bg-neutral-950 border border-neutral-900 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-[#F5C518]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Precio Colectivo (COP) *</label>
                    <input 
                      type="number" 
                      value={newProdPrice}
                      onChange={(e) => setNewProdPrice(e.target.value)}
                      placeholder="Ej. 32000" 
                      className="w-full bg-neutral-950 border border-neutral-900 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-[#F5C518]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Categoría Destino *</label>
                    <select 
                      value={newProdCatId}
                      onChange={(e) => setNewProdCatId(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-900 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-[#F5C518] text-white"
                    >
                      {menu.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Ingredientes (Separados por Comas)</label>
                    <input 
                      type="text" 
                      value={newProdIng}
                      onChange={(e) => setNewProdIng(e.target.value)}
                      placeholder="Ej. Triple Angus, Tocineta crocant, Queso" 
                      className="w-full bg-neutral-950 border border-neutral-900 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-[#F5C518]"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Descripción del Plato (Sugerencias/Detalle)</label>
                    <input 
                      type="text" 
                      value={newProdDesc}
                      onChange={(e) => setNewProdDesc(e.target.value)}
                      placeholder="Ej. Elaborada con los mejores cortes de Cárnicos acompañados de vegetales frescos..." 
                      className="w-full bg-neutral-950 border border-neutral-900 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-[#F5C518]"
                    />
                  </div>
                  <div className="md:col-span-2 pt-2">
                    <button 
                      type="submit"
                      className="w-full bg-green-600 hover:bg-green-500 text-white font-extrabold py-3.5 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Publicar Plato en el Menú
                    </button>
                  </div>
                </form>
              </div>

              {/* STOCK MANAGEMENT AND PRICES */}
              <div className="bg-[#111] p-5 rounded-2xl border border-neutral-800/80">
                <h3 className="text-xs font-bold text-[#F5C518] uppercase tracking-wider mb-3">
                  Control de Disponibilidad y Tarifas del Catálogo
                </h3>
                <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2">
                  {menu.map(cat => (
                    <div key={cat.id} className="space-y-2">
                      <h4 className="text-[11px] font-extrabold text-neutral-400 tracking-wider uppercase bg-neutral-950 px-3 py-1.5 rounded-lg">
                        {cat.name}
                      </h4>
                      <div className="divide-y divide-neutral-900">
                        {cat.items.map(item => (
                          <div 
                            key={item.id} 
                            className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                          >
                            <span className="font-bold text-white min-w-32">{item.name}</span>
                            
                            <div className="flex items-center gap-3">
                              {/* Price updater */}
                              <div className="flex items-center gap-1 bg-neutral-950 rounded-lg px-2 border border-neutral-900">
                                <span className="text-neutral-500">$</span>
                                <input 
                                  type="number"
                                  value={item.price}
                                  onChange={(e) => handlePriceChange(cat.id, item.id, e.target.value)}
                                  className="w-20 pl-1 py-1.5 bg-transparent border-none focus:outline-none font-bold text-amber-400 font-mono text-xs"
                                />
                              </div>

                              {/* Stock Toggler button */}
                              <button 
                                onClick={() => toggleProductAvailability(cat.id, item.id)}
                                className={`px-4 py-1.5 rounded-xl font-bold flex items-center justify-center text-[10px] uppercase cursor-pointer transition-colors w-24 ${
                                  item.ok 
                                    ? 'bg-green-950/60 text-green-300 border border-green-500/20' 
                                    : 'bg-rose-950/60 text-rose-300 border border-rose-500/20'
                                }`}
                              >
                                {item.ok ? 'Disponible' : 'Pausado'}
                              </button>

                              {/* Direct details editor */}
                              <button 
                                onClick={() => handleStartEditingProduct(cat.id, item)}
                                className="p-2 hover:bg-sky-500/10 text-sky-400 rounded-lg transition-all cursor-pointer"
                                title="Editar información de producto (nombre, precio, descripción, etc)"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>

                              {/* Deleter */}
                              <button 
                                onClick={() => deleteProductFromMenu(cat.id, item.id)}
                                className="p-2 hover:bg-rose-500/10 text-rose-400 rounded-lg transition-all"
                                title="Eliminar definitivamente"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* --- ADVANCED COUPONS MANAGEMENT --- */}
              <div id="gestor-cupones-admin" className="bg-[#111] p-5 rounded-2xl border border-neutral-800/80 space-y-6">
                <div className="flex items-center gap-2 border-b border-neutral-900 pb-3">
                  <Ticket className="w-5 h-5 text-amber-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Gestión de Cupones de Promoción
                    </h3>
                    <p className="text-[10px] text-gray-500 font-mono">Genera cupones de descuento, combos por unidades (2x1) y precios especiales para platos.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left panel: Add Coupon */}
                  <div className="lg:col-span-12 xl:col-span-5 bg-neutral-950 p-4 rounded-xl border border-neutral-900/60 space-y-4">
                    <h4 className="text-[11px] font-bold text-[#F5C518] uppercase tracking-widest font-mono">
                      ➕ Crear Nuevo Cupón
                    </h4>
                    
                    <form onSubmit={handleCreateCoupon} className="space-y-3.5 text-xs">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">CÓDIGO DEL CUPÓN *</label>
                        <input 
                          type="text"
                          value={newCouponCode}
                          onChange={(e) => setNewCouponCode(e.target.value)}
                          placeholder="Ej. PROMO3000, 2X1HAMBURGUESA"
                          className="w-full bg-[#111] border border-neutral-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-[#F5C518] uppercase font-mono tracking-wider placeholder-neutral-700"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">TIPO DE PROMOCIÓN *</label>
                        <select
                          value={newCouponType}
                          onChange={(e) => {
                            const val = e.target.value as any;
                            setNewCouponType(val);
                            // Set defaults to avoid blank values
                            if (val === 'specific_product') {
                              const firstProd = menu.flatMap(c => c.items)[0]?.id || '';
                              setNewCouponSpecificProdId(firstProd);
                            }
                          }}
                          className="w-full bg-[#111] border border-neutral-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-[#F5C518]"
                        >
                          <option value="percent">Porcentaje de Descuento (%)</option>
                          <option value="fixed">Descuento de Dinero Fijo ($)</option>
                          <option value="free_shipping">Envío Gratis (Domicilio)</option>
                          <option value="bogo">Por Unidades / BOGO (Lleva X, paga Y)</option>
                          <option value="specific_product">Descuento en Producto Específico</option>
                        </select>
                      </div>

                      {/* Percent, Fixed & Specific product discount value */}
                      {(newCouponType === 'percent' || newCouponType === 'fixed' || newCouponType === 'specific_product') && (
                        <div>
                          <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                            {newCouponType === 'percent' 
                              ? 'PORCENTAJE DE DESCUENTO (%) *' 
                              : newCouponType === 'fixed' 
                                ? 'MONTO EN DINERO ($ COP) *' 
                                : 'VALOR DE DESCUENTO PARA EL PRODUCTO *'}
                          </label>
                          <input 
                            type="number"
                            value={newCouponValue}
                            onChange={(e) => setNewCouponValue(Number(e.target.value))}
                            placeholder={newCouponType === 'percent' ? 'Ej. 15 (para 15% OFF)' : 'Ej. 5000'}
                            className="w-full bg-[#111] border border-neutral-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-[#F5C518] font-mono"
                          />
                        </div>
                      )}

                      {/* BOGO parameters */}
                      {newCouponType === 'bogo' && (
                        <div className="grid grid-cols-2 gap-2 bg-[#111] p-3 rounded-xl border border-neutral-900">
                          <div>
                            <label className="text-[9px] uppercase font-bold text-gray-400 block mb-1">LLEVA CANTIDAD (X)</label>
                            <input 
                              type="number"
                              min={1}
                              value={newCouponBogoBuyQty}
                              onChange={(e) => setNewCouponBogoBuyQty(Math.max(1, Number(e.target.value)))}
                              className="w-full bg-black border border-neutral-800 rounded-lg py-1.5 px-2 text-white text-center font-mono font-bold"
                            />
                            <p className="text-[8px] text-gray-500 mt-1">Ej. 2 para 2x1</p>
                          </div>
                          <div>
                            <label className="text-[9px] uppercase font-bold text-gray-400 block mb-1">CANT. GRATIS (Y)</label>
                            <input 
                              type="number"
                              min={1}
                              value={newCouponBogoFreeQty}
                              onChange={(e) => setNewCouponBogoFreeQty(Math.max(1, Number(e.target.value)))}
                              className="w-full bg-black border border-neutral-800 rounded-lg py-1.5 px-2 text-white text-center font-mono font-bold text-emerald-400"
                            />
                            <p className="text-[8px] text-gray-500 mt-1">Ej. 1 para pagar 1</p>
                          </div>
                        </div>
                      )}

                      {/* Select Specific Product (For specific_product and optional for bogo) */}
                      {(newCouponType === 'specific_product' || newCouponType === 'bogo') && (
                        <div>
                          <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                            SELECCIONAR PLATO REQUISITO *
                          </label>
                          <select
                            value={newCouponSpecificProdId}
                            onChange={(e) => setNewCouponSpecificProdId(e.target.value)}
                            className="w-full bg-[#111] border border-neutral-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-[#F5C518]"
                          >
                            <option value="">-- Todos los platos / General --</option>
                            {menu.flatMap(c => c.items).map(item => (
                              <option key={item.id} value={item.id}>
                                {item.name} (${item.price.toLocaleString('es-CO')})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Specific Product discount type selector */}
                      {newCouponType === 'specific_product' && (
                        <div>
                          <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">TIPO DE DESCUENTO EN EL PLATO</label>
                          <select
                            value={newCouponSpecificProdDiscType}
                            onChange={(e) => setNewCouponSpecificProdDiscType(e.target.value as any)}
                            className="w-full bg-[#111] border border-neutral-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-[#F5C518]"
                          >
                            <option value="percent">Porcentaje (%) del valor del plato</option>
                            <option value="fixed">Descuento de dinero fijo ($ COP)</option>
                          </select>
                        </div>
                      )}

                      <button
                        type="submit"
                        className="w-full bg-[#F5C518] hover:bg-amber-400 text-black py-2.5 rounded-xl font-bold uppercase text-[10.5px] tracking-wider transition-colors cursor-pointer mt-2"
                      >
                        Crear Cupón 🎟️
                      </button>
                    </form>
                  </div>

                  {/* Right panel: Active Coupons list */}
                  <div className="lg:col-span-12 xl:col-span-7 space-y-3.5">
                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest font-mono">
                      📋 Cupones Registrados ({coupons.length})
                    </h4>

                    {coupons.length === 0 ? (
                      <div className="text-center py-10 bg-neutral-950 rounded-xl border border-neutral-900 text-gray-600">
                        <Ticket className="w-10 h-10 mx-auto opacity-20 mb-2" />
                        <p className="text-xs">No hay cupones configurados.</p>
                        <p className="text-[10px] text-gray-500 mt-1">Crea cupones a la izquierda para incentivar tus ventas.</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                        {coupons.map((coupon, idx) => {
                          const targetProductInfo = menu.flatMap(c => c.items).find(p => p.id === coupon.specificProductId);
                          return (
                            <div 
                              key={coupon.code + '-' + idx}
                              className="bg-neutral-950 border border-neutral-900 rounded-xl p-3 flex items-center justify-between gap-3 relative text-xs"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-white tracking-widest bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded text-[11px]">
                                    {coupon.code}
                                  </span>
                                  <span className={`text-[8.5px] font-bold px-1.5 py-0.2 rounded border uppercase font-mono ${
                                    coupon.active 
                                      ? 'text-emerald-400 bg-emerald-500/5 border-emerald-500/20' 
                                      : 'text-neutral-500 bg-neutral-950 border-neutral-800'
                                  }`}>
                                    {coupon.active ? 'Activo' : 'Inactivo'}
                                  </span>
                                </div>

                                <p className="text-[10.5px] text-gray-400">
                                  Tipo: <span className="font-bold text-gray-300">
                                    {coupon.type === 'percent' && `Descuento del ${coupon.value}% sobre la orden.`}
                                    {coupon.type === 'fixed' && `Descuento Fijo de $${coupon.value.toLocaleString('es-CO')} COP.`}
                                    {coupon.type === 'free_shipping' && `Envío / Domicilio Gratis total.`}
                                    {coupon.type === 'bogo' && (
                                      `Compra ${coupon.bogoBuyQty} unidades y lleva ${coupon.bogoFreeQty} GRATIS ${targetProductInfo ? `de ${targetProductInfo.name}` : '(en cualquier plato)'}`
                                    )}
                                    {coupon.type === 'specific_product' && (
                                      `Descuento de ${
                                        coupon.specificProductDiscountType === 'percent' 
                                          ? `${coupon.value}%` 
                                          : `$${coupon.value.toLocaleString('es-CO')} COP`
                                      } en el plato "${targetProductInfo?.name || 'Producto Desconocido'}".`
                                    )}
                                  </span>
                                </p>
                              </div>

                              <div className="flex items-center gap-1.5">
                                {/* Toggle state switcher */}
                                <button
                                  onClick={() => handleToggleCouponActive(coupon.code)}
                                  className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all font-mono cursor-pointer border ${
                                    coupon.active 
                                      ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20 hover:bg-emerald-950/60' 
                                      : 'bg-neutral-900 text-gray-400 border-neutral-800 hover:bg-neutral-800'
                                  }`}
                                  title={coupon.active ? "Pausar cupón" : "Activar cupón"}
                                >
                                  {coupon.active ? 'Pausar' : 'Activar'}
                                </button>

                                {/* Delete button */}
                                <button
                                  onClick={() => handleDeleteCoupon(coupon.code)}
                                  className="p-1.5 hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 rounded-lg transition-all cursor-pointer border border-transparent hover:border-rose-500/20"
                                  title="Eliminar cupón de raíz"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- EDIT PRODUCT MODAL --- */}
      <AnimatePresence>
        {editingProduct && (
          <div className="fixed inset-0 bg-black/90 z-50 overflow-y-auto flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-[#0a0a0b] border border-neutral-900 rounded-3xl p-6 space-y-6 shadow-2xl relative"
            >
              <button 
                onClick={() => setEditingProduct(null)}
                className="absolute top-4 right-4 bg-neutral-900 hover:bg-neutral-800 p-2 text-gray-500 hover:text-white rounded-full transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 pb-2 border-b border-neutral-900">
                <Edit3 className="w-5 h-5 text-[#F5C518]" />
                <h3 className="font-bebas text-2xl tracking-widest text-[#F5C518]">Modificar Plato</h3>
              </div>

              <form onSubmit={handleSaveProductEdit} className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Nombre Comercial *</label>
                  <input 
                    type="text" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Ej. Hamburguesa de Pollo" 
                    className="w-full bg-neutral-950 border border-neutral-900 rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:border-[#F5C518] text-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Precio COP *</label>
                    <input 
                      type="number" 
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      placeholder="Ej. 25000" 
                      className="w-full bg-neutral-950 border border-neutral-900 rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:border-[#F5C518] text-white font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Categoría Destino *</label>
                    <select 
                      value={editCatId}
                      onChange={(e) => setEditCatId(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-900 rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:border-[#F5C518] text-white"
                    >
                      {menu.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Ingredientes (Separados por Comas)</label>
                  <input 
                    type="text" 
                    value={editIng}
                    onChange={(e) => setEditIng(e.target.value)}
                    placeholder="Ej. Pan brioche, Tomate, Queso" 
                    className="w-full bg-neutral-950 border border-neutral-900 rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:border-[#F5C518] text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Descripción del Plato</label>
                  <textarea 
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    rows={3}
                    placeholder="Escribe la descripción del plato..." 
                    className="w-full bg-neutral-950 border border-neutral-900 rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:border-[#F5C518] text-white resize-none"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-gray-300 py-3 rounded-xl text-xs font-bold uppercase cursor-pointer transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl text-xs font-bold uppercase cursor-pointer transition-colors"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
