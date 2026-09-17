"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import {
  ArrowRight,
  CheckCircle2,
  Database,
  Shield,
  Users,
  TrendingUp,
  BarChart3,
  FileText,
  Package,
  Truck,
  Settings,
  Clock,
} from "lucide-react";
import { useRef, useState } from "react";
import dynamic from "next/dynamic";
const AnimatedCircularProgressBar = dynamic(() => import("@/components/ui/animated-circular-progress-bar").then(m => m.AnimatedCircularProgressBar), { ssr: false });

export default function HomePage() {
  if (typeof window !== "undefined") {
    window.location.replace("/auth");
    return null;
  }
  return null;
}
