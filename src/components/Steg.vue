<template>
  <div>
    <h1>Key</h1>
    <input
      v-model="key"
      type="text"
      name="key"
      size="80"
    />
    <h1>Secret Message</h1>
    <textarea
      v-model="message"
      name="message"
      cols="80"
      rows="10"
    ></textarea>
    <h1>Cover Message</h1>
    <textarea
      v-model="cover"
      name="cover"
      cols="80"
      rows="10"
    ></textarea>
    <h1>Final Message</h1>
    <textarea
      :value="final"
      name="final"
      cols="80"
      rows="10"
      readonly
    ></textarea>
    <h1
      v-if="error"
      style="color: red"
    >{{ error }}</h1>
  </div>
</template>

<script>
import { steganographize } from "../services/steganography";

export default {
  name: 'Steg',

  data() {
    return {
      key: null,
      message: null,
      cover: null,
      final: null,
      error: null,
    };
  },

  methods: {
    update(key, message, cover) {
      try {
        this.final = steganographize(key, message, cover);
      } catch (e) {
        console.error(e);
        this.error = e.message;
      }
    },
  },

  watch: {
    key(value) {
      this.update(value, this.message, this.cover);
    },

    message(value) {
      this.message = value.toLowerCase();
      this.update(this.key, this.message, this.cover);
    },

    cover(value) {
      this.update(this.key, this.message, value);
    },
  },
}
</script>

<style scoped>
</style>
