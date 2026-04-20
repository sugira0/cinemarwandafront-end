export function getDeviceId() {
  let id = localStorage.getItem('deviceId');
  if (!id) {
    id = `dev_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    localStorage.setItem('deviceId', id);
  }
  return id;
}

export function getDeviceName() {
  const ua = navigator.userAgent;
  if (/iPhone|iPad/i.test(ua)) return 'iPhone/iPad';
  if (/Android/i.test(ua)) return 'Android Device';
  if (/Windows/i.test(ua)) return 'Windows PC';
  if (/Mac/i.test(ua)) return 'Mac';
  return 'Browser';
}

function roundNumber(value, digits = 4) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return Number(numeric.toFixed(digits));
}

function buildLocationLabel(location) {
  if (location.latitude !== null && location.longitude !== null) {
    return `${location.latitude}, ${location.longitude}`;
  }

  if (location.timezone) return location.timezone;
  return null;
}

async function getBrowserLocation(timeoutMs = 1800) {
  if (!navigator.geolocation) {
    return { source: 'unknown' };
  }

  if (navigator.permissions?.query) {
    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      if (permission.state === 'denied') {
        return { source: 'unknown' };
      }
    } catch {
      // Some browsers do not support geolocation permission queries cleanly.
    }
  }

  return new Promise((resolve) => {
    let settled = false;

    const finish = (payload) => {
      if (settled) return;
      settled = true;
      resolve(payload);
    };

    const timer = window.setTimeout(() => {
      finish({ source: 'unknown' });
    }, timeoutMs);

    try {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          window.clearTimeout(timer);
          finish({
            latitude: roundNumber(position.coords.latitude),
            longitude: roundNumber(position.coords.longitude),
            accuracy: roundNumber(position.coords.accuracy, 0),
            source: 'browser',
            capturedAt: new Date().toISOString(),
          });
        },
        () => {
          window.clearTimeout(timer);
          finish({ source: 'unknown' });
        },
        {
          enableHighAccuracy: false,
          maximumAge: 5 * 60 * 1000,
          timeout: timeoutMs,
        }
      );
    } catch {
      window.clearTimeout(timer);
      finish({ source: 'unknown' });
    }
  });
}

export async function getDeviceContext() {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  const location = await getBrowserLocation();

  return {
    deviceId: getDeviceId(),
    deviceName: getDeviceName(),
    deviceLocation: {
      ...location,
      timezone,
      label: buildLocationLabel({ ...location, timezone }),
    },
    deviceMeta: {
      userAgent: navigator.userAgent || null,
      platform: navigator.userAgentData?.platform || navigator.platform || null,
      language: navigator.language || null,
    },
  };
}
