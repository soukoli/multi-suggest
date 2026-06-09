"use client";

import { addIcon } from "@iconify/react";

import dumbbellLinear from "@iconify-icons/solar/dumbbell-linear";
import swimmingLinear from "@iconify-icons/solar/swimming-linear";
import fireLinear from "@iconify-icons/solar/fire-linear";
import meditationLinear from "@iconify-icons/solar/meditation-linear";
import waterdropsLinear from "@iconify-icons/solar/waterdrops-linear";
import mapPointLinear from "@iconify-icons/solar/map-point-linear";
import mapPointBold from "@iconify-icons/solar/map-point-bold";
import compassLinear from "@iconify-icons/solar/compass-linear";
import compassBold from "@iconify-icons/solar/compass-bold";
import heartLinear from "@iconify-icons/solar/heart-linear";
import heartBold from "@iconify-icons/solar/heart-bold";
import heartBrokenLinear from "@iconify-icons/solar/heart-broken-linear";
import mapArrowRightLinear from "@iconify-icons/solar/map-arrow-right-linear";
import squareArrowRightUpLinear from "@iconify-icons/solar/square-arrow-right-up-linear";
import restartLinear from "@iconify-icons/solar/restart-linear";
import refreshLinear from "@iconify-icons/solar/refresh-linear";
import sunLinear from "@iconify-icons/solar/sun-linear";
import moonLinear from "@iconify-icons/solar/moon-linear";
import tagLinear from "@iconify-icons/solar/tag-linear";
import usersGroupRoundedLinear from "@iconify-icons/solar/users-group-rounded-linear";
import cardLinear from "@iconify-icons/solar/card-linear";
import verifiedCheckLinear from "@iconify-icons/solar/verified-check-linear";
import shieldCheckLinear from "@iconify-icons/solar/shield-check-linear";
import runningLinear from "@iconify-icons/solar/running-linear";
import tennisLinear from "@iconify-icons/solar/tennis-linear";
import hikingLinear from "@iconify-icons/solar/hiking-linear";
import leafLinear from "@iconify-icons/solar/leaf-linear";
import peopleNearbyLinear from "@iconify-icons/solar/people-nearby-linear";
import magniferLinear from "@iconify-icons/solar/magnifer-linear";
import tuning2Linear from "@iconify-icons/solar/tuning-2-linear";
import closeCircleLinear from "@iconify-icons/solar/close-circle-linear";
import calendarLinear from "@iconify-icons/solar/calendar-linear";

addIcon("solar:dumbbell-linear", dumbbellLinear);
addIcon("solar:swimming-linear", swimmingLinear);
addIcon("solar:fire-linear", fireLinear);
addIcon("solar:meditation-linear", meditationLinear);
addIcon("solar:waterdrops-linear", waterdropsLinear);
addIcon("solar:map-point-linear", mapPointLinear);
addIcon("solar:map-point-bold", mapPointBold);
addIcon("solar:compass-linear", compassLinear);
addIcon("solar:compass-bold", compassBold);
addIcon("solar:heart-linear", heartLinear);
addIcon("solar:heart-bold", heartBold);
addIcon("solar:heart-broken-linear", heartBrokenLinear);
addIcon("solar:map-arrow-right-linear", mapArrowRightLinear);
addIcon("solar:square-arrow-right-up-linear", squareArrowRightUpLinear);
addIcon("solar:restart-linear", restartLinear);
addIcon("solar:refresh-linear", refreshLinear);
addIcon("solar:sun-linear", sunLinear);
addIcon("solar:moon-linear", moonLinear);
addIcon("solar:tag-linear", tagLinear);
addIcon("solar:users-group-rounded-linear", usersGroupRoundedLinear);
addIcon("solar:card-linear", cardLinear);
addIcon("solar:verified-check-linear", verifiedCheckLinear);
addIcon("solar:shield-check-linear", shieldCheckLinear);
addIcon("solar:running-linear", runningLinear);
addIcon("solar:tennis-linear", tennisLinear);
addIcon("solar:hiking-linear", hikingLinear);
addIcon("solar:leaf-linear", leafLinear);
addIcon("solar:people-nearby-linear", peopleNearbyLinear);
addIcon("solar:magnifer-linear", magniferLinear);
addIcon("solar:tuning-2-linear", tuning2Linear);
addIcon("solar:close-circle-linear", closeCircleLinear);
addIcon("solar:calendar-linear", calendarLinear);

export const ICONS = {
  // Categories
  fitness: "solar:dumbbell-linear",
  swimming: "solar:swimming-linear",
  wellness: "solar:fire-linear",
  yoga: "solar:meditation-linear",
  group: "solar:running-linear",
  sports: "solar:tennis-linear",
  climbing: "solar:hiking-linear",
  outdoor: "solar:leaf-linear",
  kids: "solar:people-nearby-linear",
  other: "solar:map-point-linear",
  // Navigation
  discover: "solar:compass-linear",
  discoverActive: "solar:compass-bold",
  nearby: "solar:map-point-linear",
  nearbyActive: "solar:map-point-bold",
  favorites: "solar:heart-linear",
  favoritesActive: "solar:heart-bold",
  // Actions
  heart: "solar:heart-linear",
  heartFilled: "solar:heart-bold",
  heartBroken: "solar:heart-broken-linear",
  navigate: "solar:map-arrow-right-linear",
  externalLink: "solar:square-arrow-right-up-linear",
  restart: "solar:restart-linear",
  spinner: "solar:refresh-linear",
  // Theme
  sun: "solar:sun-linear",
  moon: "solar:moon-linear",
  // Filters & badges
  freeEntry: "solar:verified-check-linear",
  card: "solar:card-linear",
  verified: "solar:shield-check-linear",
  tag: "solar:tag-linear",
  search: "solar:magnifer-linear",
  filter: "solar:tuning-2-linear",
  close: "solar:close-circle-linear",
  calendar: "solar:calendar-linear",
} as const;
