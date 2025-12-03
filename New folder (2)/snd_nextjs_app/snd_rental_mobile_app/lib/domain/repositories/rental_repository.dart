import '../../data/models/rental_model.dart';

abstract class RentalRepository {
  // Get all rentals with pagination
  Future<List<RentalModel>> getRentals({
    int page = 1,
    int limit = 20,
    String? search,
    String? status,
    String? customerId,
    String? projectId,
  });

  // Get rental by ID
  Future<RentalModel?> getRentalById(String id);

  // Create new rental
  Future<RentalModel> createRental(RentalModel rental);

  // Update rental
  Future<RentalModel> updateRental(String id, RentalModel rental);

  // Delete rental
  Future<void> deleteRental(String id);

  // Get rental items
  Future<List<Map<String, dynamic>>> getRentalItems(String rentalId);

  // Add item to rental
  Future<Map<String, dynamic>> addRentalItem(
    String rentalId,
    Map<String, dynamic> itemData,
  );

  // Update rental item
  Future<Map<String, dynamic>> updateRentalItem(
    String rentalId,
    String itemId,
    Map<String, dynamic> itemData,
  );

  // Remove rental item
  Future<void> removeRentalItem(String rentalId, String itemId);

  // Generate quotation for rental
  Future<Map<String, dynamic>> generateQuotation(String rentalId);

  // Approve rental
  Future<void> approveRental(String rentalId);

  // Activate rental
  Future<void> activateRental(String rentalId);

  // Complete rental
  Future<void> completeRental(String rentalId);

  // Cancel rental
  Future<void> cancelRental(String rentalId);

  // Get rental history
  Future<List<Map<String, dynamic>>> getRentalHistory(String rentalId);

  // Get rental payments
  Future<List<Map<String, dynamic>>> getRentalPayments(String rentalId);

  // Add payment to rental
  Future<Map<String, dynamic>> addRentalPayment(
    String rentalId,
    Map<String, dynamic> paymentData,
  );

  // Update rental status
  Future<void> updateRentalStatus(String rentalId, String status);

  // Search rentals
  Future<List<RentalModel>> searchRentals(String query);

  // Get rentals by status
  Future<List<RentalModel>> getRentalsByStatus(String status);

  // Get rentals by customer
  Future<List<RentalModel>> getRentalsByCustomer(String customerId);

  // Get rentals by project
  Future<List<RentalModel>> getRentalsByProject(String projectId);

  // Get pending rentals
  Future<List<RentalModel>> getPendingRentals();

  // Get active rentals
  Future<List<RentalModel>> getActiveRentals();

  // Get rental statistics
  Future<Map<String, dynamic>> getRentalStatistics();
}
