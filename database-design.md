# طراحی دیتابیس سیستم حسابداری (ERD و منطق طراحی)

> مدل داده‌ی بک‌اند یک نرم‌افزار حسابداری تخصصی ایرانی (سبک حسابفا)، استخراج‌شده از مستندات `extraction-details.md` و اسکیل `accounting-system`.
> نمودارها با **Mermaid** رسم شده‌اند و در VSCode / GitHub رندر می‌شوند.
> پایگاه‌داده هدف: **PostgreSQL** — نوع پول `NUMERIC(24,4)`، تعداد `NUMERIC(20,4)`.

---

## فلسفه کلی

قلب سیستم یک **دفتر کل واحد** است. هر عملیات (فاکتور، دریافت، تولید، حقوق…) در نهایت به یک **سند حسابداری دو‌طرفه** تبدیل می‌شود و **تمام گزارش‌ها** از جدول `journal_line` محاسبه می‌شوند. یعنی `journal_line` تنها **منبع حقیقت (source of truth)** برای اعداد است.

### ۶ لایه‌ی معماری

```mermaid
flowchart TB
  L1["۱. سازمان و پیکربندی<br/>company · fiscal_year · user · project · currency · setting"]
  L2["۲. کدینگ حساب‌ها<br/>account_group · account"]
  L3["۳. موجودیت‌های پایه<br/>contact · product · bank · cash · warehouse · salesman"]
  L4["۴. دفتر کل (هسته / منبع حقیقت)<br/>journal_document · journal_line"]
  L5["۵. اسناد تجاری<br/>invoice · receipt · transfer · check · production · payroll"]
  L6["۶. موتور موجودی<br/>inventory_layer · warehouse_voucher · inventory_stock"]
  L1 --> L2 --> L3 --> L4
  L5 -->|تولید سند| L4
  L5 --> L6
  L6 -->|بهای تمام‌شده| L4
```

---

## نمودار ۱ — سازمان و پیکربندی

```mermaid
erDiagram
  COMPANY ||--o{ FISCAL_YEAR : دارد
  COMPANY ||--o{ APP_USER : دارد
  COMPANY ||--o{ PROJECT : دارد
  COMPANY ||--o{ EXCHANGE_RATE : دارد
  COMPANY ||--o{ DEFAULT_ACCOUNT : دارد
  COMPANY ||--|| FINANCIAL_SETTING : دارد
  APP_USER ||--o{ USER_PERMISSION : دارد
  CURRENCY ||--o{ EXCHANGE_RATE : نرخ

  COMPANY {
    int id PK
    string name
    string legal_name
    string business_type
    string national_id
    string economic_code
    string registration_number
    string base_currency FK
  }
  FISCAL_YEAR {
    int id PK
    int company_id FK
    string title
    date start_date
    date end_date
    bool is_closed
    bool allow_opening_edit
  }
  APP_USER {
    int id PK
    int company_id FK
    string name
    string email
    string role
  }
  USER_PERMISSION {
    int id PK
    int user_id FK
    string module
    string access_level
  }
  PROJECT {
    int id PK
    int company_id FK
    string code
    string name
  }
  CURRENCY {
    string code PK
    string name
    string symbol
  }
  EXCHANGE_RATE {
    int id PK
    int company_id FK
    string currency_code FK
    numeric rate_to_base
    date rate_date
  }
  DEFAULT_ACCOUNT {
    int company_id FK
    string key
    int account_id FK
  }
  FINANCIAL_SETTING {
    int company_id FK
    string inventory_system
    string valuation_method
    bool use_production
    bool use_warehouse
    bool use_multicurrency
    numeric vat_rate
    bool allow_negative_inventory
    bool separate_temp_numbers
  }
```

**توضیح:** `company_id` روی همه جداول اصلی برای چند-شرکتی. `fiscal_year` مبنای بستن سال و انتقال مانده. `default_account` نگاشت *عملیات → حساب* است که موتور سند از آن می‌خواند (مثل `key='sales_receivable' → account_id`). دسترسی کاربر **تفکیکی per-module** با `user_permission`.

---

## نمودار ۲ — کدینگ حساب‌ها و هسته دفتر کل ⭐

```mermaid
erDiagram
  ACCOUNT_GROUP ||--o{ ACCOUNT : "گروه"
  ACCOUNT ||--o{ ACCOUNT : "parent (خود-ارجاع)"
  ACCOUNT ||--o{ JOURNAL_LINE : "حساب معین"
  JOURNAL_DOCUMENT ||--|{ JOURNAL_LINE : "آرتیکل‌ها"
  FISCAL_YEAR ||--o{ JOURNAL_DOCUMENT : "سال مالی"
  PROJECT ||--o{ JOURNAL_LINE : "تخصیص"

  ACCOUNT_GROUP {
    int id PK
    string name
    string nature "debit|credit"
  }
  ACCOUNT {
    int id PK
    int company_id FK
    int parent_id FK "خود-ارجاع"
    int group_id FK
    string code
    string name
    string level "group|general|subsidiary"
    string nature "debit|credit"
    string detail_type "none|contact|product|bank|cash|petty_cash|project|salesman"
    bool is_active
  }
  JOURNAL_DOCUMENT {
    int id PK
    int company_id FK
    int fiscal_year_id FK
    bigint number
    string reference
    date doc_date
    time doc_time
    int project_id FK
    string description
    string type "auto|manual"
    string source_type "polymorphic"
    int source_id
  }
  JOURNAL_LINE {
    int id PK
    int document_id FK
    int account_id FK
    string detail_type "polymorphic"
    int detail_id
    string description
    string currency_code
    numeric currency_amount
    numeric debit
    numeric credit
    int project_id FK
  }
```

**تصمیم‌های کلیدی این نمودار:**

1. **`account` خود-ارجاع است** (`parent_id`) تا سلسله‌مراتب *گروه ← کل ← معین* در یک جدول بماند؛ سطح با `level` مشخص می‌شود.
2. **تفصیل شناور (Floating Detail):** اشخاص و کالاها حساب جدا در جدول حساب‌ها **ندارند**. حساب معین با `detail_type` می‌گوید هنگام ثبت سند چه نوع تفصیلی لازم است، و `journal_line.detail_type + detail_id` (رابطه **چندریختی**) آن را به شخص/کالا/بانک/پروژه وصل می‌کند.
3. **قید طلایی:** برای هر سند `Σ debit = Σ credit` (با trigger تضمین می‌شود — سند نامتوازن ممنوع).
4. **مانده‌ها ذخیره نمی‌شوند، محاسبه می‌شوند:** مانده = `SUM(debit) − SUM(credit)`. برای سرعت می‌توان جدول کش `account_balance` افزود.
5. **`source_type/source_id`** سند حسابداری را به سند تجاری منشأ وصل می‌کند (دو‌طرفه).

---

## نمودار ۳ — موجودیت‌های پایه (اشخاص، کالا، قیمت)

```mermaid
erDiagram
  CONTACT ||--o{ CONTACT_ROLE : "نقش‌ها"
  CONTACT ||--o{ CONTACT_BANK_ACCOUNT : "حساب‌ها"
  CATEGORY ||--o{ CONTACT : "دسته"
  CATEGORY ||--o{ PRODUCT : "دسته"
  PRICE_LIST ||--o{ CONTACT : "قیمت پیش‌فرض"
  PRODUCT ||--o{ PRODUCT_BARCODE : "بارکدها"
  PRODUCT ||--o{ PRODUCT_UNIT : "واحد فرعی"
  PRODUCT ||--o{ PRODUCT_PRICE : "قیمت‌ها"
  PRICE_LIST ||--o{ PRODUCT_PRICE : "لیست"
  CONTACT ||--o{ SALESMAN : "شخص مرتبط"
  CONTACT ||--o{ SHAREHOLDER : "سهامدار"

  CONTACT {
    int id PK
    int company_id FK
    string account_code
    string nick_name "اجباری / نام نمایشی"
    string company
    string first_name
    string last_name
    int category_id FK
    numeric credit_limit
    int default_price_list_id FK
    string tax_type "1..5 سامانه مودیان"
    string national_id
    string economic_code
    bool is_active
  }
  CONTACT_ROLE {
    int id PK
    int contact_id FK
    string role "customer|supplier|shareholder|employee"
  }
  CONTACT_BANK_ACCOUNT {
    int id PK
    int contact_id FK
    string bank_name
    string account_no
    string iban
    string card_no
  }
  CATEGORY {
    int id PK
    int company_id FK
    int parent_id FK
    string type "contact|product"
    string name
  }
  PRODUCT {
    int id PK
    int company_id FK
    string account_code
    string name "اجباری"
    string code
    int category_id FK
    string type "product|service"
    numeric sale_price
    numeric purchase_price
    string main_unit
    bool track_inventory
    numeric reorder_point
    int lead_time_days
    bool sale_taxable
    numeric sale_tax_rate
    string tax_type
    bool is_active
  }
  PRODUCT_BARCODE {
    int id PK
    int product_id FK
    string barcode
  }
  PRODUCT_UNIT {
    int id PK
    int product_id FK
    string name
    numeric factor "ضریب تبدیل"
  }
  PRICE_LIST {
    int id PK
    int company_id FK
    string title
    string currency_code FK "ارز مستقل"
  }
  PRODUCT_PRICE {
    int product_id FK
    int price_list_id FK
    numeric price
  }
  SALESMAN {
    int id PK
    int company_id FK
    int contact_id FK
    bool register_commission
    numeric sale_percent
    numeric sale_return_percent
    int expense_account_id FK
  }
  SHAREHOLDER {
    int company_id FK
    int contact_id FK
    numeric share_percent "مجموع=100"
  }
```

**توضیح:**
- **نقش شخص یک‌به‌چند است** (`contact_role`) نه چند بولین، چون یک شخص هم‌زمان می‌تواند مشتری+تامین‌کننده باشد.
- **لیست قیمت پویا:** `product_price` رابطه‌ی **چند‌به‌چند** کالا×لیست‌قیمت است؛ هر `price_list` ارز مستقل دارد (قیمت دلاری، همکار، عمده…).
- شخص، کالا، بانک و… همگی «تفصیل شناور» برای `journal_line`اند.

---

## نمودار ۴ — فروش و خرید (فاکتور واحد)

```mermaid
erDiagram
  INVOICE ||--|{ INVOICE_LINE : "اقلام"
  INVOICE ||--o{ INVOICE_ADDITION : "اضافات و کسورات"
  INVOICE_LINE ||--o{ INVOICE_SERIAL : "شماره سریال"
  CONTACT ||--o{ INVOICE : "طرف حساب"
  SALESMAN ||--o{ INVOICE : "فروشنده"
  PRODUCT ||--o{ INVOICE_LINE : "کالا"
  JOURNAL_DOCUMENT ||--o| INVOICE : "سند خودکار"

  INVOICE {
    int id PK
    int company_id FK
    int fiscal_year_id FK
    string type "sale|purchase|sale_return|purchase_return|wastage"
    bigint number
    string reference
    date invoice_date
    date due_date
    int contact_id FK
    int salesman_id FK
    int project_id FK
    string title
    string currency_code
    numeric exchange_rate
    numeric discount_percent
    numeric shipping_amount
    string status "draft|confirmed|settled|returned"
    int document_id FK
    string tax_uid "شناسه یکتای مالیاتی"
  }
  INVOICE_LINE {
    int id PK
    int invoice_id FK
    int product_id FK
    string description
    string unit
    numeric quantity
    numeric unit_price
    numeric discount
    numeric tax
    numeric total
    int warehouse_id FK
    numeric cost_amount "بهای تمام‌شده FIFO"
  }
  INVOICE_ADDITION {
    int id PK
    int invoice_id FK
    string title
    numeric amount
  }
  INVOICE_SERIAL {
    int id PK
    int invoice_line_id FK
    string serial_number
  }
```

**تصمیم مهم — یکپارچه‌سازی:** به‌جای ۵ جدول تقریباً یکسان، یک جدول `invoice` با ستون `type` (فروش/خرید/برگشت‌ها/ضایعات). ساختار همه یکسان است؛ فقط منطق سند و علامت‌ها فرق دارد. `cost_amount` روی هر سطر، بهای تمام‌شده‌ی محاسبه‌شده از لایه‌های FIFO را نگه می‌دارد.

---

## نمودار ۵ — بانکداری، دریافت/پرداخت، چک، انتقال

```mermaid
erDiagram
  RECEIPT ||--|{ RECEIPT_ITEM : "بابت"
  RECEIPT ||--|{ RECEIPT_METHOD : "روش"
  JOURNAL_DOCUMENT ||--o| RECEIPT : "سند خودکار"
  JOURNAL_DOCUMENT ||--o| TRANSFER : "سند خودکار"
  JOURNAL_DOCUMENT ||--o| CHECK : "سند خودکار"
  CHECK ||--o{ CHECK_STATUS_HISTORY : "چرخه وضعیت"
  BANK ||--o{ CHECK : "بانک"
  CONTACT ||--o{ CHECK : "شخص"

  RECEIPT {
    int id PK
    int company_id FK
    string type "receive|pay|receive_other|pay_other"
    bigint number
    date doc_date
    int project_id FK
    string description
    string currency_code
    int document_id FK
  }
  RECEIPT_ITEM {
    int id PK
    int receipt_id FK
    string target_type "contact|account"
    int target_id
    numeric amount
    string description
  }
  RECEIPT_METHOD {
    int id PK
    int receipt_id FK
    string method "cash|bank|petty_cash|check|contact|account"
    int ref_id
    numeric amount
  }
  TRANSFER {
    int id PK
    int company_id FK
    bigint number
    date doc_date
    string from_type "bank|cash|petty_cash"
    int from_id
    numeric from_amount
    numeric from_fee
    string to_type
    int to_id
    numeric to_amount
    int document_id FK
  }
  CHECK {
    int id PK
    int company_id FK
    string direction "received|paid"
    string sayad_no
    string check_no
    numeric amount
    date due_date
    string bank_name
    int bank_id FK
    string status "in_collection|cashed|returned|spent|voided"
    int contact_id FK
    int document_id FK
  }
  CHECK_STATUS_HISTORY {
    int id PK
    int check_id FK
    string status
    date status_date
    string note
  }
  BANK {
    int id PK
    int company_id FK
    string name
    string account_no
    string iban
    string currency_code "ارز مستقل"
    bool is_default
  }
```

**توضیح:**
- **دریافت/پرداخت/هزینه/درآمد همه با `receipt` مدل می‌شوند.** `receipt_item.target_type` می‌گوید بابت *شخص* است یا *حساب* (هزینه/درآمد)؛ `receipt_method` روش دریافت را می‌دهد. پس **جدول جدا برای هزینه/درآمد لازم نیست**.
- **چرخه چک** با `status` روی خود چک + جدول تاریخچه `check_status_history` (در جریان وصول ← وصول/عودت/خرج).

---

## نمودار ۶ — موتور موجودی (FIFO + کاردکس)

```mermaid
erDiagram
  WAREHOUSE ||--o{ WAREHOUSE_VOUCHER : "انبار"
  WAREHOUSE_VOUCHER ||--|{ WAREHOUSE_VOUCHER_LINE : "حرکات"
  PRODUCT ||--o{ WAREHOUSE_VOUCHER_LINE : "کالا"
  PRODUCT ||--o{ INVENTORY_LAYER : "لایه FIFO"
  WAREHOUSE ||--o{ INVENTORY_LAYER : "انبار"
  PRODUCT ||--o{ INVENTORY_STOCK : "موجودی جاری"
  WAREHOUSE ||--o{ INVENTORY_STOCK : "انبار"
  STOCK_TAKING ||--|{ STOCK_TAKING_LINE : "شمارش"

  WAREHOUSE_VOUCHER {
    int id PK
    int company_id FK
    bigint number
    date voucher_date
    string type "sale|purchase|returns|wastage|transfer|production"
    int warehouse_id FK
    string source_type
    int source_id
  }
  WAREHOUSE_VOUCHER_LINE {
    int id PK
    int voucher_id FK
    int product_id FK
    string direction "in|out"
    numeric quantity
    numeric unit_cost
    int from_warehouse_id FK
    int to_warehouse_id FK
  }
  INVENTORY_LAYER {
    int id PK
    int product_id FK
    int warehouse_id FK
    date in_date
    numeric remaining_qty
    numeric unit_cost
    int source_line_id FK
  }
  INVENTORY_STOCK {
    int product_id FK
    int warehouse_id FK
    numeric quantity "کش"
    numeric avg_cost
  }
  STOCK_TAKING {
    int id PK
    int company_id FK
    bigint number
    date taking_date
    int warehouse_id FK
    string status
    int document_id FK
  }
  STOCK_TAKING_LINE {
    int id PK
    int stock_taking_id FK
    int product_id FK
    numeric system_qty
    numeric counted_qty
    numeric diff
  }
```

**توضیح — چرا موجودی یک عدد ساده نیست:**
- **`inventory_layer`**: هر ورود یک لایه‌ی FIFO با `(remaining_qty, unit_cost, in_date)`؛ هر خروج لایه‌های قدیمی را به ترتیب مصرف می‌کند و بهای تمام‌شده را از آن‌ها برمی‌دارد.
- **`warehouse_voucher_line`**: منبع **کاردکس/کارت انبار** (همه حرکات ورود/خروج).
- **`inventory_stock`**: کش موجودی جاری برای سرعت.
- **بازمحاسبه:** چون ویرایش سوابق گذشته زنجیره‌ی FIFO را می‌شکند، منطق ارزیابی در یک سرویس متمرکز پیاده می‌شود تا قابل **recompute** باشد.

---

## نمودار ۷ — تولید

```mermaid
erDiagram
  PRODUCTION_FORMULA ||--o{ FORMULA_MATERIAL : "مواد اولیه"
  PRODUCTION_FORMULA ||--o{ FORMULA_LABOR : "دستمزد مستقیم"
  PRODUCTION_FORMULA ||--o{ FORMULA_OVERHEAD : "سربار"
  PRODUCTION_FORMULA ||--o{ PRODUCTION_ORDER : "بر اساس فرمول"
  PRODUCTION_ORDER ||--|{ PRODUCTION_ORDER_MATERIAL : "مواد مصرفی"
  PRODUCT ||--o{ PRODUCTION_FORMULA : "محصول"
  JOURNAL_DOCUMENT ||--o| PRODUCTION_ORDER : "سند تکمیل تولید"

  PRODUCTION_FORMULA {
    int id PK
    int company_id FK
    string code
    string name
    int produced_product_id FK
    int finished_warehouse_id FK
    bool is_active
  }
  FORMULA_MATERIAL {
    int id PK
    int formula_id FK
    int product_id FK
    string unit
    numeric quantity
    int warehouse_id FK
  }
  FORMULA_LABOR {
    int id PK
    int formula_id FK
    int contact_id FK
    numeric amount
  }
  FORMULA_OVERHEAD {
    int id PK
    int formula_id FK
    string description
    numeric amount
  }
  PRODUCTION_ORDER {
    int id PK
    int company_id FK
    bigint number
    date order_date
    int formula_id FK
    int produced_product_id FK
    int finished_warehouse_id FK
    numeric quantity
    numeric unit_cost
    int customer_id FK
    string status "in_progress|completed"
    int document_id FK
  }
  PRODUCTION_ORDER_MATERIAL {
    int id PK
    int order_id FK
    int product_id FK
    numeric quantity_per
    numeric total_quantity
    int warehouse_id FK
  }
```

**توضیح:** فرمول تولید (BOM) سه جزء بهای تمام‌شده دارد: **مواد + دستمزد + سربار**. دستور تولید، مواد را از فرمول × تعداد تکثیر می‌کند و با تکمیل، سند «موجودی محصول = مواد+دستمزد+سربار» می‌زند.

---

## نمودار ۸ — اقساط و حقوق

```mermaid
erDiagram
  INSTALLMENT_AGREEMENT ||--|{ INSTALLMENT : "جدول اقساط"
  CONTACT ||--o{ INSTALLMENT_AGREEMENT : "طرف قرارداد"
  INVOICE ||--o| INSTALLMENT_AGREEMENT : "فاکتور مرجع"
  RECEIPT ||--o{ INSTALLMENT : "پرداخت قسط"
  PAYROLL_DOCUMENT ||--|{ PAYROLL_LINE : "کارمندان"
  CONTACT ||--o{ PAYROLL_LINE : "کارمند"

  INSTALLMENT_AGREEMENT {
    int id PK
    int company_id FK
    bigint number
    date agreement_date
    int contact_id FK
    int invoice_id FK
    numeric down_payment
    numeric loan_amount
    string profit_method
    int installment_count
    numeric annual_interest_rate
    int period_days
    numeric installment_amount
    numeric interest
    numeric total_amount
  }
  INSTALLMENT {
    int id PK
    int agreement_id FK
    int seq
    date due_date
    numeric amount
    numeric principal
    numeric interest_part
    string status "paid|due|overdue"
    int receipt_id FK
  }
  PAYROLL_DOCUMENT {
    int id PK
    int company_id FK
    bigint number
    date doc_date
    int project_id FK
    int document_id FK
  }
  PAYROLL_LINE {
    int id PK
    int payroll_document_id FK
    int contact_id FK
    numeric base_salary
    numeric overtime
    numeric shift_bonus
    numeric mission_allowance
    numeric insurance_deduction
    numeric tax_deduction
    numeric net
  }
```

**توضیح:** جدول اقساط با استهلاک (تفکیک اصل/سود) خودکار تولید می‌شود؛ هر پرداخت قسط به یک `receipt` وصل است. سند حقوق: هر ردیف کارمند، اجزای درآمد و کسورات را نگه می‌دارد و به سند «هزینه حقوق / حقوق پرداختنی / کسورات» تبدیل می‌شود.

---

## نمودار ۹ — یکپارچگی سند تجاری با دفتر کل (الگوی مرکزی)

```mermaid
flowchart LR
  subgraph Docs["اسناد تجاری (source)"]
    INV[invoice]
    RCP[receipt]
    TRF[transfer]
    CHK[check]
    PRD[production_order]
    PAY[payroll_document]
    STK[stock_taking]
  end
  ENGINE{{"Posting Engine<br/>موتور سند"}}
  JD[(journal_document<br/>+ journal_line)]
  DA[[default_account<br/>نگاشت عملیات→حساب]]

  INV & RCP & TRF & CHK & PRD & PAY & STK --> ENGINE
  DA --> ENGINE
  ENGINE -->|source_type/source_id| JD
  JD -->|Σ بدهکار = Σ بستانکار| JD
```

**الگوی ثابت:** هر سند تجاری یک `document_id` دارد که به سند حسابداری تولیدشده اشاره می‌کند، و سند حسابداری با `source_type/source_id` به منشأ برمی‌گردد. موتور سند (Posting Engine) با کمک `default_account`، بدهکار/بستانکارها را می‌سازد.

---

## جدول تصمیم‌های طراحی

| موضوع | تصمیم | چرا |
|---|---|---|
| منبع حقیقت | فقط `journal_line`؛ مانده‌ها محاسبه می‌شوند | تراز همیشه درست؛ کش اختیاری برای سرعت |
| اشخاص/کالا | تفصیل شناور (`detail_type+detail_id`) نه حساب جدا | مثل کدینگ واقعی؛ بدون تکرار در جدول حساب |
| فاکتورها | جدول واحد `invoice` با `type` | ساختار یکسان، کاهش تکرار |
| دریافت/پرداخت/هزینه/درآمد | جدول واحد `receipt` با `type` + `target_type` | حذف جداول موازی |
| نوع پول | `NUMERIC(24,4)` هرگز `float` | ریال عدد بزرگ؛ بدون خطای گرد کردن |
| چند-ارزی | مبلغ پایه + `currency_code`+`currency_amount`+نرخ روی هر آرتیکل | تراز به پول پایه، گزارش ارزی جدا |
| موجودی | لایه‌های FIFO + کاردکس + کش | بهای تمام‌شده دقیق + قابلیت recompute |
| چند-شرکتی/سال مالی | `company_id` + `fiscal_year_id` روی اسناد | جداسازی و بستن سال |
| حذف | soft-delete (`is_active`/`deleted_at`) | یکپارچگی حسابداری و ردگیری |
| تراز سند | trigger روی `Σdebit=Σcredit` | جلوگیری از سند نامتوازن در سطح دیتابیس |
| پیوست | `attachment(entity_type, entity_id)` پلی‌مورفیک | آرشیو فایل هر موجودیت |

---

## ایندکس‌های پیشنهادی (کارایی)

- `journal_line(account_id, detail_type, detail_id)` — محاسبه مانده حساب/شخص/کالا
- `journal_line(document_id)` — بازیابی آرتیکل‌های سند
- `journal_document(company_id, fiscal_year_id, doc_date)` — دفتر روزنامه/بازه
- `journal_document(source_type, source_id)` — یافتن سند از روی سند تجاری
- `invoice(company_id, type, status, invoice_date)` — لیست‌ها و گزارش فروش/خرید
- `inventory_layer(product_id, warehouse_id, in_date)` — مصرف FIFO
- `inventory_stock(product_id, warehouse_id)` — موجودی جاری (کلید مرکب/PK)

---

## قدم بعدی

این سند، طرح مفهومی و منطق است. مرحله بعد می‌تواند **DDL کامل `CREATE TABLE`** (PostgreSQL با کلید/ایندکس/trigger تراز) باشد — بگو تا بسازم.
