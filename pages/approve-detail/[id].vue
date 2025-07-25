<template>
    <div>
       <ApproveDetailTimeLine :id="route.params.id" />
    </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware:["auth"],
})

const route = useRoute()
</script>

<style scoped>

</style>