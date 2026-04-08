<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('barbershop_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('sku')->nullable();
            $table->string('category')->nullable();
            $table->unsignedInteger('cost_cents')->default(0);
            $table->unsignedInteger('price_cents')->default(0);
            $table->integer('stock_quantity')->default(0);
            $table->integer('min_stock_quantity')->default(0);
            $table->boolean('is_active')->default(true);
            $table->json('metadata')->nullable();
            $table->timestampsTz();

            $table->index(['barbershop_id', 'name']);
            $table->index(['barbershop_id', 'category']);
            $table->unique(['barbershop_id', 'sku']);
        });

        Schema::create('suppliers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('barbershop_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('contact_name')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('document')->nullable();
            $table->string('status')->default('active');
            $table->text('notes')->nullable();
            $table->json('metadata')->nullable();
            $table->timestampsTz();

            $table->index(['barbershop_id', 'name']);
            $table->index(['barbershop_id', 'status']);
        });

        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('barbershop_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('supplier_id')->nullable()->constrained()->nullOnDelete();
            $table->string('type');
            $table->integer('quantity');
            $table->unsignedInteger('unit_cost_cents')->default(0);
            $table->unsignedInteger('total_cost_cents')->default(0);
            $table->string('reason')->nullable();
            $table->string('reference')->nullable();
            $table->timestampTz('moved_at')->nullable();
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->json('metadata')->nullable();
            $table->timestampsTz();

            $table->index(['barbershop_id', 'type']);
            $table->index(['barbershop_id', 'moved_at']);
            $table->index(['product_id', 'moved_at']);
        });

        Schema::create('stock_alerts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('barbershop_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->string('level')->default('warning');
            $table->string('status')->default('open');
            $table->text('message');
            $table->timestampTz('resolved_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestampsTz();

            $table->index(['barbershop_id', 'status']);
            $table->index(['barbershop_id', 'level']);
        });

        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('barbershop_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('category');
            $table->text('description')->nullable();
            $table->unsignedInteger('amount_cents');
            $table->string('status')->default('pending');
            $table->timestampTz('due_at')->nullable();
            $table->timestampTz('paid_at')->nullable();
            $table->string('payment_method')->nullable();
            $table->string('recurrence')->nullable();
            $table->json('metadata')->nullable();
            $table->timestampsTz();

            $table->index(['barbershop_id', 'status']);
            $table->index(['barbershop_id', 'due_at']);
            $table->index(['barbershop_id', 'category']);
        });

        Schema::create('payouts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('barbershop_id')->constrained()->cascadeOnDelete();
            $table->date('period_start');
            $table->date('period_end');
            $table->string('status')->default('pending');
            $table->unsignedInteger('gross_cents')->default(0);
            $table->unsignedInteger('discount_cents')->default(0);
            $table->unsignedInteger('net_cents')->default(0);
            $table->timestampTz('paid_at')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('generated_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->json('metadata')->nullable();
            $table->timestampsTz();

            $table->index(['barbershop_id', 'status']);
            $table->index(['barbershop_id', 'period_start', 'period_end']);
        });

        Schema::create('commissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('barbershop_id')->constrained()->cascadeOnDelete();
            $table->foreignId('membership_id')->nullable()->constrained('barbershop_memberships')->nullOnDelete();
            $table->string('reference_type')->nullable();
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->unsignedInteger('base_amount_cents');
            $table->decimal('rate', 5, 2);
            $table->unsignedInteger('amount_cents');
            $table->string('status')->default('pending');
            $table->timestampTz('settled_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestampsTz();

            $table->index(['barbershop_id', 'status']);
            $table->index(['barbershop_id', 'membership_id']);
        });

        Schema::create('loyalty_programs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('barbershop_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->unsignedInteger('points_per_currency_unit')->default(1);
            $table->boolean('is_active')->default(true);
            $table->timestampTz('starts_at')->nullable();
            $table->timestampTz('ends_at')->nullable();
            $table->json('settings')->nullable();
            $table->timestampsTz();

            $table->index(['barbershop_id', 'is_active']);
        });

        Schema::create('points_ledger', function (Blueprint $table) {
            $table->id();
            $table->foreignId('barbershop_id')->constrained()->cascadeOnDelete();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('loyalty_program_id')->nullable()->constrained()->nullOnDelete();
            $table->integer('change_points');
            $table->string('reason');
            $table->string('reference_type')->nullable();
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->timestampTz('expires_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestampsTz();

            $table->index(['barbershop_id', 'customer_id']);
            $table->index(['barbershop_id', 'created_at']);
        });

        Schema::create('rewards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('barbershop_id')->constrained()->cascadeOnDelete();
            $table->foreignId('loyalty_program_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->unsignedInteger('points_cost');
            $table->integer('stock_quantity')->nullable();
            $table->boolean('is_active')->default(true);
            $table->json('metadata')->nullable();
            $table->timestampsTz();

            $table->index(['barbershop_id', 'is_active']);
            $table->index(['barbershop_id', 'points_cost']);
        });

        Schema::create('redemptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('barbershop_id')->constrained()->cascadeOnDelete();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('reward_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('points_spent');
            $table->string('status')->default('requested');
            $table->timestampTz('redeemed_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestampsTz();

            $table->index(['barbershop_id', 'status']);
            $table->index(['barbershop_id', 'customer_id']);
        });

        Schema::create('coupons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('barbershop_id')->constrained()->cascadeOnDelete();
            $table->string('code');
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('discount_type');
            $table->unsignedInteger('discount_value');
            $table->unsignedInteger('max_redemptions')->nullable();
            $table->unsignedInteger('redeemed_count')->default(0);
            $table->timestampTz('starts_at')->nullable();
            $table->timestampTz('ends_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->json('metadata')->nullable();
            $table->timestampsTz();

            $table->index(['barbershop_id', 'is_active']);
            $table->unique(['barbershop_id', 'code']);
        });

        Schema::create('campaigns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('barbershop_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('channel');
            $table->string('status')->default('draft');
            $table->json('audience_filter')->nullable();
            $table->text('message_template')->nullable();
            $table->timestampTz('starts_at')->nullable();
            $table->timestampTz('ends_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestampsTz();

            $table->index(['barbershop_id', 'status']);
            $table->index(['barbershop_id', 'channel']);
        });

        Schema::create('campaign_runs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('barbershop_id')->constrained()->cascadeOnDelete();
            $table->foreignId('campaign_id')->constrained()->cascadeOnDelete();
            $table->string('status')->default('queued');
            $table->timestampTz('scheduled_at')->nullable();
            $table->timestampTz('started_at')->nullable();
            $table->timestampTz('finished_at')->nullable();
            $table->json('metrics')->nullable();
            $table->text('logs')->nullable();
            $table->json('metadata')->nullable();
            $table->timestampsTz();

            $table->index(['barbershop_id', 'status']);
            $table->index(['barbershop_id', 'scheduled_at']);
        });

        Schema::create('birthday_automations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('barbershop_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->smallInteger('days_before')->default(0);
            $table->string('channel')->default('whatsapp');
            $table->string('status')->default('active');
            $table->text('template')->nullable();
            $table->boolean('is_active')->default(true);
            $table->json('metadata')->nullable();
            $table->timestampsTz();

            $table->index(['barbershop_id', 'status']);
            $table->index(['barbershop_id', 'is_active']);
        });

        Schema::create('support_tickets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('barbershop_id')->constrained()->cascadeOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->text('description');
            $table->string('status')->default('open');
            $table->string('priority')->default('medium');
            $table->foreignId('assigned_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestampTz('closed_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestampsTz();

            $table->index(['barbershop_id', 'status']);
            $table->index(['barbershop_id', 'priority']);
        });

        Schema::create('ticket_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('barbershop_id')->constrained()->cascadeOnDelete();
            $table->foreignId('ticket_id')->constrained('support_tickets')->cascadeOnDelete();
            $table->foreignId('sender_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('sender_customer_id')->nullable()->constrained('customers')->nullOnDelete();
            $table->text('message');
            $table->json('attachments')->nullable();
            $table->json('metadata')->nullable();
            $table->timestampsTz();

            $table->index(['barbershop_id', 'ticket_id']);
        });

        Schema::create('faq_articles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('barbershop_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('slug');
            $table->text('content');
            $table->string('category')->nullable();
            $table->string('status')->default('published');
            $table->smallInteger('sort_order')->default(0);
            $table->json('metadata')->nullable();
            $table->timestampsTz();

            $table->index(['barbershop_id', 'status']);
            $table->index(['barbershop_id', 'category']);
            $table->unique(['barbershop_id', 'slug']);
        });

        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('barbershop_id')->constrained()->cascadeOnDelete();
            $table->foreignId('recipient_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('recipient_customer_id')->nullable()->constrained('customers')->nullOnDelete();
            $table->string('type');
            $table->string('title');
            $table->text('body');
            $table->string('status')->default('queued');
            $table->timestampTz('read_at')->nullable();
            $table->timestampTz('sent_at')->nullable();
            $table->json('payload')->nullable();
            $table->json('metadata')->nullable();
            $table->timestampsTz();

            $table->index(['barbershop_id', 'status']);
            $table->index(['barbershop_id', 'type']);
        });

        Schema::create('notification_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('barbershop_id')->constrained()->cascadeOnDelete();
            $table->string('key');
            $table->string('channel');
            $table->string('title_template')->nullable();
            $table->text('body_template');
            $table->boolean('is_active')->default(true);
            $table->json('metadata')->nullable();
            $table->timestampsTz();

            $table->index(['barbershop_id', 'channel']);
            $table->unique(['barbershop_id', 'key']);
        });

        Schema::create('notification_dispatches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('barbershop_id')->constrained()->cascadeOnDelete();
            $table->foreignId('notification_id')->nullable()->constrained('notifications')->nullOnDelete();
            $table->string('channel');
            $table->string('status')->default('queued');
            $table->string('provider')->nullable();
            $table->string('provider_reference')->nullable();
            $table->text('error_message')->nullable();
            $table->timestampTz('last_attempt_at')->nullable();
            $table->unsignedSmallInteger('attempt_count')->default(0);
            $table->json('metadata')->nullable();
            $table->timestampsTz();

            $table->index(['barbershop_id', 'status']);
            $table->index(['barbershop_id', 'channel']);
        });

        Schema::create('security_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('barbershop_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('event_type');
            $table->string('severity')->default('info');
            $table->string('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->json('context')->nullable();
            $table->timestampTz('occurred_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestampsTz();

            $table->index(['barbershop_id', 'event_type']);
            $table->index(['barbershop_id', 'severity']);
            $table->index(['barbershop_id', 'occurred_at']);
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('barbershop_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('action');
            $table->string('entity_type')->nullable();
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->json('before_state')->nullable();
            $table->json('after_state')->nullable();
            $table->string('ip_address')->nullable();
            $table->timestampTz('occurred_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestampsTz();

            $table->index(['barbershop_id', 'action']);
            $table->index(['barbershop_id', 'entity_type', 'entity_id']);
            $table->index(['barbershop_id', 'occurred_at']);
        });

        Schema::create('webhook_deliveries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('barbershop_id')->constrained()->cascadeOnDelete();
            $table->string('source');
            $table->string('event_type');
            $table->string('status')->default('pending');
            $table->string('url');
            $table->json('payload');
            $table->integer('response_code')->nullable();
            $table->text('response_body')->nullable();
            $table->timestampTz('last_attempt_at')->nullable();
            $table->unsignedSmallInteger('attempt_count')->default(0);
            $table->json('metadata')->nullable();
            $table->timestampsTz();

            $table->index(['barbershop_id', 'source']);
            $table->index(['barbershop_id', 'status']);
            $table->index(['barbershop_id', 'event_type']);
        });

        Schema::create('analytics_snapshots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('barbershop_id')->constrained()->cascadeOnDelete();
            $table->string('scope')->default('barbershop');
            $table->date('snapshot_date');
            $table->json('metrics');
            $table->json('metadata')->nullable();
            $table->timestampsTz();

            $table->index(['barbershop_id', 'scope', 'snapshot_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('analytics_snapshots');
        Schema::dropIfExists('webhook_deliveries');
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('security_events');
        Schema::dropIfExists('notification_dispatches');
        Schema::dropIfExists('notification_templates');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('faq_articles');
        Schema::dropIfExists('ticket_messages');
        Schema::dropIfExists('support_tickets');
        Schema::dropIfExists('birthday_automations');
        Schema::dropIfExists('campaign_runs');
        Schema::dropIfExists('campaigns');
        Schema::dropIfExists('coupons');
        Schema::dropIfExists('redemptions');
        Schema::dropIfExists('rewards');
        Schema::dropIfExists('points_ledger');
        Schema::dropIfExists('loyalty_programs');
        Schema::dropIfExists('commissions');
        Schema::dropIfExists('payouts');
        Schema::dropIfExists('expenses');
        Schema::dropIfExists('stock_alerts');
        Schema::dropIfExists('stock_movements');
        Schema::dropIfExists('suppliers');
        Schema::dropIfExists('products');
    }
};

