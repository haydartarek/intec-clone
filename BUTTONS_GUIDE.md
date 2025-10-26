# 🎨 دليل نظام الأزرار - INTEC Brussels

## 📋 نظرة عامة

تم إنشاء نظام أزرار موحد ومتناسق لموقع INTEC Brussels يتضمن 4 أنواع رئيسية من الأزرار:

---

## 🎯 1. Primary Buttons - الأزرار الأساسية

**الاستخدام:** التسجيل، إرسال النماذج، CTA الرئيسية

**الأصناف المتاحة:**
```html
<button class="btn-primary">تسجيل الآن</button>
<button class="btn--primary">إرسال</button>
<a href="#" class="button-primary">ابدأ</a>
```

**الألوان:**
- Background: `#0f828a` (Primary)
- Hover: `#0b5c61` (Primary Dark)
- Text: `#ffffff` (White)

**متى تستخدمه:**
- ✅ زر التسجيل الرئيسي
- ✅ إرسال النماذج
- ✅ CTA الأساسية في Hero Section
- ✅ الإجراءات الحاسمة

---

## 🎨 2. Accent Buttons - الأزرار الثانوية

**الاستخدام:** الروابط البديلة، الإجراءات المساعدة

**الأصناف المتاحة:**
```html
<button class="btn-accent">اعرف المزيد</button>
<button class="btn--accent">تواصل معنا</button>
<a href="#" class="button-accent">احجز موعد</a>
```

**الألوان:**
- Background: `#25bdb7` (Accent)
- Hover: `#0f828a` (Primary)
- Text: `#ffffff` (White)

**متى تستخدمه:**
- ✅ "اعرف المزيد"
- ✅ "تواصل معنا"
- ✅ الإجراءات الثانوية المهمة
- ✅ حفظ كمسودة

---

## ⭕ 3. Outline Buttons - الأزرار ذات الحدود

**الاستخدام:** الأزرار البيضاء مع حدود ملونة

**الأصناف المتاحة:**
```html
<button class="btn-outline">View Courses</button>
<button class="btn--outline">عرض البرامج</button>
<a href="#" class="button-outline">تصفح</a>
```

**الألوان:**
- Background: `transparent`
- Border: `#0f828a` (Primary)
- Text: `#0f828a` (Primary)
- Hover Background: `#0f828a` (Primary)
- Hover Text: `#ffffff` (White)

**متى تستخدمه:**
- ✅ "View courses"
- ✅ "تصفح البرامج"
- ✅ الإجراءات الاستكشافية
- ✅ CTA الثانوية في Hero

---

## 💫 4. Soft Buttons - الأزرار الناعمة

**الاستخدام:** الأزرار البيضاء الناعمة بخلفية فاتحة

**الأصناف المتاحة:**
```html
<button class="btn-soft">Plan Intake</button>
<button class="btn--soft">خطط دراستك</button>
<a href="#" class="button-soft">احجز استشارة</a>
```

**الألوان:**
- Background: `#e0f7f6` (Accent Soft)
- Border: `rgba(15, 130, 138, 0.1)`
- Text: `#0f828a` (Primary)
- Hover Background: `#25bdb7` (Accent)
- Hover Text: `#ffffff` (White)

**متى تستخدمه:**
- ✅ "Plan Intake"
- ✅ "احجز استشارة"
- ✅ الإجراءات اللطيفة
- ✅ أزرار الكروت الفرعية

---

## 📐 أحجام الأزرار

### Small - صغير
```html
<button class="btn-primary btn-sm">زر صغير</button>
```

### Normal - عادي (افتراضي)
```html
<button class="btn-primary">زر عادي</button>
```

### Large - كبير
```html
<button class="btn-primary btn-lg">زر كبير</button>
```

---

## 🔄 حالات الأزرار

### Disabled - معطل
```html
<button class="btn-primary" disabled>معطل</button>
```

**التصميم:**
- Opacity: 50%
- Cursor: not-allowed
- Pointer Events: none

---

## 💼 أمثلة على الاستخدام

### Hero Section
```html
<div class="hero__actions">
  <a class="btn-primary btn-lg" href="inschrijven.html">سجل الآن</a>
  <a class="btn-outline btn-lg" href="#opleidingen">تصفح البرامج</a>
</div>
```

### Course Card
```html
<div class="course-card">
  <h3>Python Developer</h3>
  <p>تعلم البرمجة...</p>
  <div class="card-actions">
    <a class="btn-soft" href="python.html">Plan Intake</a>
    <a class="btn-outline btn-sm" href="python.html">View Details</a>
  </div>
</div>
```

### CTA Section
```html
<section class="collaboration-cta">
  <h2>ابدأ رحلتك التعليمية</h2>
  <p>انضم إلى آلاف الطلاب...</p>
  <a class="btn-primary btn-lg" href="contact.html">تواصل معنا الآن</a>
</section>
```

### Form Section
```html
<form>
  <!-- form fields -->
  <div class="form-actions">
    <button type="submit" class="btn-primary">إرسال الطلب</button>
    <button type="button" class="btn-accent">حفظ كمسودة</button>
  </div>
</form>
```

### Partners Section
```html
<section class="partners">
  <h2>شركاؤنا</h2>
  <div class="partners-grid">
    <!-- partner logos -->
  </div>
  <a class="btn-outline" href="partners.html">اعرف المزيد عن شركائنا</a>
</section>
```

---

## 🎨 لوحة الألوان

| اللون | الكود | الاستخدام |
|------|------|----------|
| Primary | `#0f828a` | الأزرار الأساسية |
| Primary Dark | `#0b5c61` | Hover للأزرار الأساسية |
| Accent | `#25bdb7` | الأزرار الثانوية |
| Accent Soft | `#e0f7f6` | خلفية الأزرار الناعمة |
| White | `#ffffff` | نص الأزرار الملونة |

---

## ✅ قواعد أساسية

### ✓ افعل:
- استخدم `btn-primary` للإجراءات الأساسية
- استخدم `btn-accent` للإجراءات الثانوية المهمة
- استخدم `btn-outline` للاستكشاف والتصفح
- استخدم `btn-soft` للإجراءات اللطيفة في الكروت
- احترم التسلسل الهرمي البصري

### ✗ لا تفعل:
- لا تستخدم أكثر من زر `btn-primary` واحد في نفس القسم
- لا تخلط بين الأنماط القديمة والجديدة
- لا تستخدم ألوان مخصصة خارج النظام
- لا تنسى إضافة حالة `:hover` للأزرار المخصصة

---

## 🔧 الترحيل من النظام القديم

### الأصناف القديمة → الأصناف الجديدة

```html
<!-- القديم -->
<a class="button">زر</a>
<a class="button button--ghost">زر شفاف</a>

<!-- الجديد -->
<a class="btn-primary">زر</a>
<a class="btn-outline">زر شفاف</a>
```

---

## 📦 ملفات النظام

- **CSS:** `/assets/css/main.css` (الأسطر 8638-8790)
- **اختبار:** `/test-buttons.html`
- **الدليل:** `/BUTTONS_GUIDE.md` (هذا الملف)

---

## 🎯 الأولويات المرئية

```
1. btn-primary      ← أعلى أولوية (حاسم)
2. btn-accent       ← أولوية عالية (مهم)
3. btn-outline      ← أولوية متوسطة (استكشافي)
4. btn-soft         ← أولوية منخفضة (لطيف)
```

---

تم التحديث: أكتوبر 2025
الإصدار: 2.0
