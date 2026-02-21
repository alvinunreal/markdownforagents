<script setup>
defineProps({ error: { type: Object, default: null } });
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-slate-50 px-6">
    <div class="w-full max-w-lg rounded border border-slate-200 bg-white p-8 text-center">
      <p class="text-5xl font-bold text-slate-400">{{ error?.statusCode || 500 }}</p>
      <p class="mt-3 text-lg font-semibold text-slate-900">{{ error?.message || "Something went wrong" }}</p>
      <button
        class="mt-6 rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        @click="clearError({ redirect: '/' })"
      >
        Return Home
      </button>
    </div>
  </div>
</template>
