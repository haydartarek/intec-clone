# INTEC 2025 - نظام CSS الموحد 🎨

## 📚 دليل استخدام الفئات الجديدة

### 🔵 Programs Showcase Section

لعرض قائمة البرامج التدريبية:

```html
<section class="programs-showcase" id="programs">
  <div class="container">
    <div class="section-heading">
      <span class="section-label">البرامج</span>
      <h2 class="section-title">عنوان القسم</h2>
      <p class="section-lead">وصف القسم</p>
    </div>
    
    <div class="programs-showcase__grid">
      <article class="program-card">
        <div class="program-card__icon">
          <!-- SVG Icon -->
        </div>
        <h3 class="program-card__title">عنوان البرنامج</h3>
        <p class="program-card__description">وصف البرنامج</p>
        <ul class="program-card__meta">
          <li><strong>Start:</strong> التاريخ</li>
        </ul>
        <a class="program-card__link" href="#">
          اقرأ المزيد
          <svg>...</svg>
        </a>
      </article>
    </div>
  </div>
</section>
```

**الخصائص:**
- ✨ Hover effect: يرتفع الكرت 8px
- 🎨 خط ملون أعلى الكرت عند hover
- 📱 Responsive: عمود واحد على الموبايل

---

### 🔵 Training Features Section

لعرض ميزات التدريب:

```html
<section class="training-features" id="features">
  <div class="container">
    <div class="section-heading">
      <span class="section-label">الميزات</span>
      <h2 class="section-title">ماذا ستتعلم؟</h2>
      <p class="section-lead">وصف القسم</p>
    </div>
    
    <div class="training-features__grid">
      <article class="feature-card">
        <div class="feature-card__header">
          <span class="feature-card__icon">
            <!-- SVG Icon -->
          </span>
          <h3 class="feature-card__title">عنوان الميزة</h3>
        </div>
        <ul class="feature-card__list">
          <li>ميزة 1</li>
          <li>ميزة 2</li>
          <li>ميزة 3</li>
        </ul>
      </article>
    </div>
  </div>
</section>
```

**الخصائص:**
- ✅ علامة ✓ قبل كل عنصر في القائمة
- 🎨 أيقونة دائرية مع خلفية ملونة
- 📱 Responsive: عمود واحد على الموبايل

---

### 🔵 Why Choose INTEC Section

لعرض فوائد INTEC:

```html
<section class="why-choose-intec">
  <div class="container">
    <div class="section-heading">
      <span class="section-label">لماذا INTEC؟</span>
      <h2 class="section-title">ما يميزنا</h2>
      <p class="section-lead">وصف القسم</p>
    </div>
    
    <div class="why-choose-intec__grid">
      <article class="benefit-card">
        <h3 class="benefit-card__title">عنوان الفائدة</h3>
        <p class="benefit-card__text">وصف الفائدة</p>
      </article>
    </div>
  </div>
</section>
```

**الخصائص:**
- 🎨 خط ملون أعلى الكرت عند hover
- 📐 Text-align: center
- 📱 Responsive: عمود واحد على الموبايل

---

### 🔵 Enrollment CTA Section

لعرض دعوة للتسجيل:

```html
<section class="enrollment-cta">
  <div class="enrollment-cta__content container">
    <span class="enrollment-cta__eyebrow">جاهز للبدء؟</span>
    <h2>ابدأ مسيرتك اليوم</h2>
    <p class="enrollment-cta__body">وصف الدعوة</p>
    <div class="enrollment-cta__actions">
      <a class="btn-primary" href="#">سجل الآن</a>
      <a class="btn-outline" href="#">اتصل بنا</a>
    </div>
  </div>
</section>
```

**الخصائص:**
- 🌈 خلفية gradient ملونة (INTEC colors)
- ⚪ نص أبيض
- 🔘 أزرار مع تأثيرات hover مميزة
- 📱 Responsive: الأزرار تصبح full-width على الموبايل

---

## 🎨 الألوان (INTEC Brand Colors)

```css
Primary: #0f828a
Secondary: #25bdb7
Background Light: #f9fafb
Text Dark: #0d2e30
Text Body: #2d5456
```

---

## 📱 Breakpoints

```css
Mobile: max-width: 480px
Tablet: max-width: 768px
Desktop: min-width: 769px
```

---

## 🚀 استخدام الأزرار

### Primary Button
```html
<a class="btn-primary" href="#">
  <svg>...</svg>
  نص الزر
</a>
```

### Outline Button
```html
<a class="btn-outline" href="#">
  <svg>...</svg>
  نص الزر
</a>
```

---

## ✨ Animation Classes

```html
<div class="fade-up" data-delay="1">المحتوى</div>
<div class="fade-up" data-delay="2">المحتوى</div>
<div class="fade-up" data-delay="3">المحتوى</div>
```

---

## 📖 أمثلة الاستخدام

### مثال كامل - صفحة برنامج تدريبي:

```html
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>برنامج تدريبي - INTEC</title>
  <link rel="stylesheet" href="assets/css/local-fonts.css">
  <link rel="stylesheet" href="assets/css/base.css">
  <link rel="stylesheet" href="assets/css/main.css">
</head>
<body>
  <!-- Navbar هنا -->
  
  <main>
    <!-- Hero Section (محمي - لا يتغير) -->
    <section class="hero_section">...</section>
    
    <!-- Programs Showcase -->
    <section class="programs-showcase">...</section>
    
    <!-- Training Features -->
    <section class="training-features">...</section>
    
    <!-- Why Choose INTEC -->
    <section class="why-choose-intec">...</section>
    
    <!-- Enrollment CTA -->
    <section class="enrollment-cta">...</section>
  </main>
  
  <!-- Footer هنا -->
</body>
</html>
```

---

## 🛠️ ملاحظات التطوير

### ✅ الأشياء المحمية (لا تغيرها):
- `hero_section` - القسم البطل موحد ومحمي
- `index.html` - الصفحة الرئيسية مستثناة من النظام
- `data-i18n` attributes - الترجمات محفوظة

### ⚠️ أشياء مهمة:
- استخدم دائماً `container` داخل الأقسام
- استخدم `section-heading` للعناوين
- احفظ `data-i18n` attributes
- استخدم `fade-up` للanimations

---

## 📞 الدعم

في حالة وجود مشاكل أو أسئلة، راجع:
- `RESTRUCTURE-REPORT.md` - التقرير الشامل
- `assets/css/main.css` - الملف الرئيسي
- المطور: GitHub Copilot

---

**تاريخ الإنشاء:** 3 نوفمبر 2025  
**الإصدار:** 1.0.0  
**الحالة:** ✅ Production Ready
